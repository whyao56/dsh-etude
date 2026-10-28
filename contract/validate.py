#!/usr/bin/env python3
"""卡片包 v2 校验器 —— `contract/validate.js` 的 Python 双胞胎。

为什么要有两份：造包的那一侧在 Node 里跑（插件宿主是 Node），而审包、批处理、
CI 这类事情在 Python 里更顺手。两份各写一遍最容易慢慢漂开，所以规矩只有一套，
字段名、阈值、判定顺序、错误文案都逐条对齐；`tests/test_contract.py` 会拿同一批
「好包 / 坏包」分别喂给两边，只要判定不一致就报错。

用法（命令行）：
    python contract/validate.py <包目录>
包目录里必须有 `manifest.json`，图片音频相对包根目录找。

退出码：0 = 通过，1 = 不通过（错在哪逐条打在 stdout 的 JSON 里）。
"""

from __future__ import annotations

import hashlib
import json
import os
import sys
from typing import Any, Callable, Optional

FORMAT = "card-pack"
FORMAT_VERSION = 2
# 老包兼容：最早的 v2 契约写的是 "etude-lesson"。现在插件自己就是全套，
# 新包一律写 "card-pack"；旧值读得进来，但会带一条提醒。
LEGACY_FORMATS = ("etude-lesson",)
MAX_EXAMPLES = 40
MAX_SCENE_CHARS = 600
MAX_ZH_VARIANTS = 4
MIN_IMAGE_SHORT_EDGE = 640
MAX_IMAGE_BYTES = 4 * 1024 * 1024
SUPPORTED_LANGUAGES = ["en"]

Loader = Callable[[str], Optional[bytes]]


def validate_manifest(manifest: Any, load_file: Optional[Loader] = None) -> dict:
    """校验一份清单。

    `load_file(relative_path)` 负责按包内相对路径取字节。不传就只验结构，
    返回的 `mode` 会是 `structure-only` —— 那种模式下验不出「图真的在不在」，
    所以打成品包时必须传。
    """
    errors: list[str] = []
    warnings: list[str] = []
    mode = "full" if callable(load_file) else "structure-only"

    def fail(message: str) -> None:
        errors.append(message)

    def note(message: str) -> None:
        warnings.append(message)

    if not isinstance(manifest, dict):
        return {"ok": False, "mode": mode, "errors": ["清单不是一个 JSON 对象。"], "warnings": warnings}

    fmt = manifest.get("format")
    if fmt != FORMAT and fmt not in LEGACY_FORMATS:
        fail(f"format 必须是 \"{FORMAT}\"，现在是 {json.dumps(fmt, ensure_ascii=False)}。")
    elif fmt != FORMAT:
        note(f"format 是旧值 {json.dumps(fmt, ensure_ascii=False)}，还认，但新出的包应该写 \"{FORMAT}\"。")
    if manifest.get("format_version") != FORMAT_VERSION:
        fail(f"format_version 必须是 {FORMAT_VERSION}，现在是 {json.dumps(manifest.get('format_version'))}。")
    created_at = manifest.get("created_at")
    if not isinstance(created_at, str) or not created_at:
        fail("缺 created_at。")

    generator = manifest.get("generator")
    if not isinstance(generator, dict):
        fail("缺 generator。")
    else:
        if generator.get("kind") != "dsh-plugin":
            fail('generator.kind 必须是 "dsh-plugin"。')
        if not generator.get("name"):
            fail("generator.name 空着。")
        if not generator.get("version"):
            fail("generator.version 空着。")
        if not generator.get("prompt_version"):
            note("generator.prompt_version 空着，以后没法追溯是哪版提示词造的。")

    lesson = manifest.get("lesson")
    if not isinstance(lesson, dict):
        fail("缺 lesson。")
    else:
        target = lesson.get("target")
        target = target.strip() if isinstance(target, str) else ""
        if not target:
            fail("lesson.target 空着 —— 这个包没有目标。")
        if lesson.get("language") not in SUPPORTED_LANGUAGES:
            lang = json.dumps(lesson.get("language"), ensure_ascii=False)
            fail(f"语言 {lang} 现在还不能生成（只支持 {'/'.join(SUPPORTED_LANGUAGES)}）。")
        if lesson.get("kind") not in ("word", "phrase", "sentence"):
            kind = json.dumps(lesson.get("kind"), ensure_ascii=False)
            fail(f"lesson.kind 必须是 word/phrase/sentence，现在是 {kind}。")
        voice = lesson.get("voice")
        if not isinstance(voice, dict):
            fail("缺 lesson.voice —— 不知道这些语音是谁念的。")
        else:
            if not voice.get("engine"):
                fail("lesson.voice.engine 空着。")
            if not voice.get("voice"):
                fail("lesson.voice.voice 空着。")

    examples = manifest.get("examples")
    examples = examples if isinstance(examples, list) else []
    if len(examples) == 0:
        fail("一条例句都没有。")
    if len(examples) > MAX_EXAMPLES:
        fail(f"例句 {len(examples)} 条，超过上限 {MAX_EXAMPLES}。")

    seen_sentences: dict[str, int] = {}
    seen_media: dict[str, str] = {}

    for index, example in enumerate(examples):
        at = f"第 {index + 1} 条"
        if not isinstance(example, dict):
            fail(f"{at}不是一个对象。")
            continue

        sentence = example.get("sentence")
        sentence = sentence.strip() if isinstance(sentence, str) else ""
        if not sentence:
            fail(f"{at}没有句子。")
        else:
            # 用 lower() 而不是 casefold()：要和 JS 那侧 toLowerCase() 判定一致，
            # 两边对同一个包给出同一个结论比「更正确的 Unicode」更重要。
            key = sentence.lower()
            if key in seen_sentences:
                fail(f"{at}的句子和第 {seen_sentences[key]} 条重复了。")
            else:
                seen_sentences[key] = index + 1
            if len(sentence) > 400:
                fail(f"{at}的句子超过 400 字，这种长度多半是模型把解释塞进来了。")

        scene_en = example.get("scene_en")
        scene_zh = example.get("scene_zh")
        scene_en = scene_en if isinstance(scene_en, str) else ""
        scene_zh = scene_zh if isinstance(scene_zh, str) else ""
        if not scene_en.strip():
            fail(f"{at}缺 scene_en —— 卡片正面就没提示了。")
        if not scene_zh.strip():
            fail(f"{at}缺 scene_zh。")
        if len(scene_en) > MAX_SCENE_CHARS:
            fail(f"{at}的 scene_en 超过 {MAX_SCENE_CHARS} 字。")
        if len(scene_zh) > MAX_SCENE_CHARS:
            fail(f"{at}的 scene_zh 超过 {MAX_SCENE_CHARS} 字。")

        zh_variants = example.get("zh_variants")
        zh_variants = zh_variants if isinstance(zh_variants, list) else []
        if len(zh_variants) > MAX_ZH_VARIANTS:
            fail(f"{at}的中文说法 {len(zh_variants)} 种，超过 {MAX_ZH_VARIANTS}。")
        if len(zh_variants) < 2:
            fail(f"{at}的中文说法只有 {len(zh_variants)} 种，至少两种。")

        review = example.get("review")
        if not isinstance(review, dict):
            fail(f"{at}没有复核记录 —— 没点过头的图、没听过的语音不算成品。")
        else:
            image_review = review.get("image")
            if not isinstance(image_review, dict) or not str(image_review.get("by") or "").strip():
                fail(f"{at}的配图没有复核人 —— 图必须有人点过头。")
            audio_review = review.get("audio")
            if not isinstance(audio_review, dict) or not str(audio_review.get("by") or "").strip():
                fail(f"{at}的语音没有复核人。")
            elif audio_review.get("listened") is not True:
                fail(f"{at}的语音标成「没试听过」—— 试听是硬要求。")

        media = example.get("media")
        media = media if isinstance(media, dict) else {}

        def image_extra(entry: dict, at=at) -> None:
            width = _number(entry.get("width"))
            height = _number(entry.get("height"))
            short_edge = min(width, height)
            if not short_edge >= MIN_IMAGE_SHORT_EDGE:
                fail(f"{at}的配图短边只有 {short_edge} 像素（要至少 {MIN_IMAGE_SHORT_EDGE}）。")
            if _number(entry.get("bytes")) > MAX_IMAGE_BYTES:
                fail(f"{at}的配图 {_number(entry.get('bytes')) / 1024 / 1024} MB，超过 4 MB。")
            for field in ("source", "query", "license", "author", "credit_url"):
                if not str(entry.get(field) or "").strip():
                    note(f"{at}的配图缺 {field} —— 授权信息不全，别对外发这个包。")

        def audio_extra(entry: dict, at=at) -> None:
            if not _number(entry.get("bytes")) > 0:
                fail(f"{at}的语音是 0 字节。")
            if not _number(entry.get("seconds")) > 0:
                fail(f"{at}的语音读不出时长 —— 那种文件点了播放什么也不会发生。")

        _check_media(
            at=at, kind="配图", media=media.get("image"),
            load_file=load_file, errors=errors, warnings=warnings, extra=image_extra,
        )
        _check_media(
            at=at, kind="语音", media=media.get("audio"),
            load_file=load_file, errors=errors, warnings=warnings, extra=audio_extra,
        )

        # 同一份字节只许落一份，理由见 validate.js 里那段注释。
        for kind, entry in (("配图", media.get("image")), ("语音", media.get("audio"))):
            if not isinstance(entry, dict):
                continue
            file = str(entry.get("file") or "")
            if not file:
                continue
            if file in seen_media:
                fail(f"{at}的{kind}文件和{seen_media[file]}重了（{file}）。")
            else:
                seen_media[file] = at

    return {"ok": len(errors) == 0, "mode": mode, "errors": errors, "warnings": warnings}


def _number(value: Any) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return 0.0


def _check_media(
    *,
    at: str,
    kind: str,
    media: Any,
    load_file: Optional[Loader],
    errors: list[str],
    warnings: list[str],
    extra: Optional[Callable[[dict], None]],
) -> None:
    if not isinstance(media, dict):
        errors.append(f"{at}没有{kind}。")
        return
    file = str(media.get("file") or "").strip()
    if not file:
        errors.append(f"{at}的{kind}没写文件名。")
        return
    if ".." in file or file.startswith("/") or (len(file) > 1 and file[1] == ":" and file[0].isalpha()):
        errors.append(f"{at}的{kind}路径 {file} 越界了，必须是包内相对路径。")
        return
    sha = str(media.get("sha256") or "").strip().lower()
    if not _is_sha256(sha):
        errors.append(f"{at}的{kind} sha256 不是 64 位十六进制。")

    if callable(extra):
        extra(media)

    if not callable(load_file):
        return
    try:
        data = load_file(file)
    except Exception as error:  # noqa: BLE001 - 读文件失败的原因要原样带给用户
        errors.append(f"{at}的{kind}读不出来（{file}）：{error}")
        return
    if not data:
        errors.append(f"{at}的{kind}文件不存在或者是空的：{file}")
        return
    actual = hashlib.sha256(data).hexdigest()
    if actual != sha:
        errors.append(
            f"{at}的{kind} sha256 对不上：清单写 {sha[:12]}…，文件是 {actual[:12]}…。"
        )
    declared = media.get("bytes", 0)
    if _number(declared) != len(data):
        warnings.append(f"{at}的{kind}登记 {declared} 字节，文件实际 {len(data)} 字节。")


def _is_sha256(text: str) -> bool:
    if len(text) != 64:
        return False
    return all(character in "0123456789abcdef" for character in text)


def validate_pack_directory(pack_dir: str) -> dict:
    """按包目录跑一遍完整校验（结构 + 文件 + 哈希）。"""
    manifest_path = os.path.join(pack_dir, "manifest.json")
    with open(manifest_path, "r", encoding="utf-8") as handle:
        manifest = json.load(handle)

    def load_file(relative: str) -> Optional[bytes]:
        resolved = os.path.normpath(os.path.join(pack_dir, relative.replace("/", os.sep)))
        if not resolved.startswith(os.path.normpath(pack_dir)):
            raise ValueError("文件跑到包外面去了")
        try:
            with open(resolved, "rb") as handle:
                return handle.read()
        except FileNotFoundError:
            return None

    return validate_manifest(manifest, load_file)


def main(argv: list[str]) -> int:
    # Windows 上管道输出默认走控制台编码（这里是 cp936），中文 JSON 一旦被
    # 调用方按 UTF-8 读就会炸。宁可自己钉死 UTF-8。
    for stream in (sys.stdout, sys.stderr):
        reconfigure = getattr(stream, "reconfigure", None)
        if callable(reconfigure):
            reconfigure(encoding="utf-8")
    if len(argv) < 2:
        print("用法：python contract/validate.py <包目录>", file=sys.stderr)
        return 2
    pack_dir = argv[1]
    try:
        verdict = validate_pack_directory(pack_dir)
    except FileNotFoundError:
        print(json.dumps({"ok": False, "errors": ["这个目录里没有 manifest.json。"], "warnings": []}, ensure_ascii=False))
        return 1
    print(json.dumps(verdict, ensure_ascii=False, indent=2))
    return 0 if verdict["ok"] else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
