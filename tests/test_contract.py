"""契约与守卫的反证用例。

这个文件存在的理由：一条规矩如果没有人试着违反过，就等于没写。所以这里
每一条用例都在**故意造一个坏东西**，然后要求它被拒收；再补一条「好东西也
得放行」，防止防线变成「一律拒收」。

跑法（在仓库根目录）：
    python -m pytest tests/ -q

需要 node 在 PATH 里（有两条用例要借 JS 侧的 sharp 做像素体检）。
"""

from __future__ import annotations

import hashlib
import json
import shutil
import subprocess
import sys
from pathlib import Path

import pytest

REPO = Path(__file__).resolve().parent.parent
if str(REPO) not in sys.path:
    sys.path.insert(0, str(REPO))

from contract.validate import validate_manifest, validate_pack_directory  # noqa: E402

NODE = shutil.which("node")

# 一份最小的合法 JPEG（1×1 白点，只用来当「文件真的存在且哈希对得上」的替身）。
TINY_JPEG = bytes.fromhex(
    "ffd8ffe000104a46494600010100000100010000ffdb004300080606070605080707070909"
    "0a0c140d0c0b0b0c1912130f141d1a1f1e1d1a1c1c20242e2720222c231c1c2837292c3031"
    "3434341f27393d38323c2e333432ffc0000b080001000101011100ffc4001f000001050101"
    "0101010100000000000000000102030405060708090a0bffc400b510000201030302040305"
    "050404000001027d01020300041105122131410613516107227114328191a1082342b1c115"
    "52d1f02433627282090a161718191a25262728292a3435363738393a434445464748494a5354"
    "55565758595a636465666768696a737475767778797a838485868788898a9293949596979899"
    "9aa2a3a4a5a6a7a8a9aab2b3b4b5b6b7b8b9bac2c3c4c5c6c7c8c9cad2d3d4d5d6d7d8d9da"
    "e1e2e3e4e5e6e7e8e9eaf1f2f3f4f5f6f7f8f9faffda0008010100003f00fbfcffd9"
)

# 一小段合法 MP3 帧（0xFF 0xFB …），校验只要求「字节数 > 0、声明时长 > 0」。
TINY_MP3 = bytes.fromhex("fff364c4" + "00" * 200)


def example(index: int, *, with_media: bool = True, reviewed: bool = True, listened: bool = True):
    """造一条例句记录，把每张图 / 每段音频的字节也一起交出来。"""
    image_name = f"commons-{'%020x' % (0xC0FFEE00 + index)}.jpg"
    audio_name = f"edge-{'%020x' % (0xBEEF00 + index)}.mp3"

    item = {
        "ord": index + 1,
        "sentence": f"We will run out of item number {index + 1} by Friday.",
        "scene_en": f"Scene {index + 1}: somewhere with people around, mid-week.",
        "scene_zh": f"第 {index + 1} 个场景，你站在那儿跟人说话。",
        "zh_variants": ["短说法。", "长一点的说法。", "换个角度的说法。"],
        "register": "日常口语",
        "voice_hint": "flat, tired, slow",
        "image_query": "coffee cup table",
        "media": {
            "image": {
                "file": f"images/{image_name}",
                "sha256": hashlib.sha256(TINY_JPEG + bytes([index])).hexdigest(),
                "bytes": len(TINY_JPEG) + 1,
                "width": 1920,
                "height": 1280,
                "source": "commons",
                "query": "coffee cup table",
                "license": "CC BY 2.0",
                "author": "Someone",
                "credit_url": "https://commons.wikimedia.org/wiki/File:X.jpg",
            },
            "audio": {
                "file": f"audio/{audio_name}",
                "sha256": hashlib.sha256(TINY_MP3 + bytes([index])).hexdigest(),
                "bytes": len(TINY_MP3) + 1,
                "seconds": 2.5,
                "engine": "edge",
                "voice": "en-US-AriaNeural",
            },
        },
        "review": {
            "image": {"by": "me", "at": "2026-10-28T12:00:00.000Z", "candidates": 6, "picked": "x.jpg"},
            "audio": {"by": "me", "at": "2026-10-28T12:00:00.000Z", "listened": listened},
        },
    }
    if not reviewed:
        item["review"] = {}
    if not with_media:
        item["media"] = {}
    return item


def manifest(examples):
    return {
        "format": "card-pack",
        "format_version": 2,
        "generator": {
            "kind": "dsh-plugin",
            "name": "dsh-etude",
            "version": "0.1.0",
            "model": "test",
            "prompt_version": "dsh-etude-1",
            "run_id": "test",
        },
        "created_at": "2026-10-28T12:00:00.000Z",
        "lesson": {
            "target": "run out of",
            "kind": "phrase",
            "language": "en",
            "gloss": "to have no more of something",
            "ipa": "",
            "note": "",
            "voice": {"engine": "edge", "voice": "en-US-AriaNeural", "rate": "+10%", "volume": "+10%"},
        },
        "examples": examples,
        "swaps": [],
        "quality": {
            "examples": len(examples),
            "images": len(examples),
            "audios": len(examples),
            "min_image_short_edge": 1280,
            "flat_images": 0,
            "text_in_images": None,
            "pixel_analysis": "sharp",
            "reviewed_images": len(examples),
            "reviewed_audios": len(examples),
        },
    }


def write_pack(directory: Path, data: dict) -> Path:
    """把清单和媒体字节真的写到磁盘上，让「文件在不在 / 哈希对不对」有的可查。"""
    (directory / "images").mkdir(parents=True, exist_ok=True)
    (directory / "audio").mkdir(parents=True, exist_ok=True)
    for index, item in enumerate(data["examples"]):
        media = item.get("media") or {}
        image = media.get("image")
        if image:
            (directory / image["file"]).write_bytes(TINY_JPEG + bytes([index]))
        audio = media.get("audio")
        if audio:
            (directory / audio["file"]).write_bytes(TINY_MP3 + bytes([index]))
    (directory / "manifest.json").write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    return directory


def load(pack_dir: Path):
    data = json.loads((pack_dir / "manifest.json").read_text(encoding="utf-8"))

    def load_file(relative: str):
        target = (pack_dir / relative).resolve()
        if not str(target).startswith(str(pack_dir.resolve())):
            raise ValueError("文件跑到包外面去了")
        return target.read_bytes() if target.exists() else None

    return validate_manifest(data, load_file)


# ── 好东西必须放行 ─────────────────────────────────────────────────────────


def test_good_pack_passes(tmp_path):
    pack = write_pack(tmp_path / "good", manifest([example(i) for i in range(2)]))
    verdict = load(pack)
    assert verdict["ok"] is True, verdict["errors"]
    assert verdict["mode"] == "full"
    assert verdict["errors"] == []


# ── format 的老名字还认，但会提醒 ─────────────────────────────────────────


def test_legacy_format_is_accepted_with_warning(tmp_path):
    data = manifest([example(0)])
    data["format"] = "etude-lesson"
    pack = write_pack(tmp_path / "legacy", data)
    verdict = load(pack)
    assert verdict["ok"] is True, verdict["errors"]
    assert any("旧值" in one for one in verdict["warnings"]), verdict["warnings"]


def test_unknown_format_is_rejected(tmp_path):
    data = manifest([example(0)])
    data["format"] = "card-packs"
    pack = write_pack(tmp_path / "wild", data)
    verdict = load(pack)
    assert verdict["ok"] is False
    assert any("format" in one for one in verdict["errors"]), verdict["errors"]


# ── 反证 1：没有复核记录不许入库 ───────────────────────────────────────────


def test_pack_without_review_is_rejected(tmp_path):
    data = manifest([example(0, reviewed=False)])
    pack = write_pack(tmp_path / "noreview", data)
    verdict = load(pack)
    assert verdict["ok"] is False
    assert any("复核" in one for one in verdict["errors"]), verdict["errors"]


def test_audio_not_listened_is_rejected(tmp_path):
    data = manifest([example(0, listened=False)])
    pack = write_pack(tmp_path / "notlistened", data)
    verdict = load(pack)
    assert verdict["ok"] is False
    assert any("没过" in one or "试听" in one for one in verdict["errors"]), verdict["errors"]


def test_pack_without_media_is_rejected(tmp_path):
    data = manifest([example(0, with_media=False)])
    pack = write_pack(tmp_path / "nomedia", data)
    verdict = load(pack)
    assert verdict["ok"] is False
    assert any("配图" in one and "没有" in one for one in verdict["errors"]), verdict["errors"]


# ── 反证 2：文件必须真在，哈希必须对得上 ───────────────────────────────────


def test_missing_image_file_is_rejected(tmp_path):
    data = manifest([example(0)])
    pack = write_pack(tmp_path / "missing", data)
    (pack / data["examples"][0]["media"]["image"]["file"]).unlink()
    verdict = load(pack)
    assert verdict["ok"] is False
    assert any("不存在" in one for one in verdict["errors"]), verdict["errors"]


def test_sha256_mismatch_is_rejected(tmp_path):
    data = manifest([example(0)])
    pack = write_pack(tmp_path / "swapped", data)
    victim = pack / data["examples"][0]["media"]["image"]["file"]
    victim.write_bytes(TINY_JPEG + b"tampered")
    verdict = load(pack)
    assert verdict["ok"] is False
    assert any("sha256 对不上" in one for one in verdict["errors"]), verdict["errors"]


def test_small_image_is_rejected(tmp_path):
    data = manifest([example(0)])
    data["examples"][0]["media"]["image"]["height"] = 480
    pack = write_pack(tmp_path / "small", data)
    verdict = load(pack)
    assert verdict["ok"] is False
    assert any("短边" in one for one in verdict["errors"]), verdict["errors"]


def test_duplicate_sentence_is_rejected(tmp_path):
    first = example(0)
    second = example(1)
    second["sentence"] = first["sentence"].upper()
    pack = write_pack(tmp_path / "dup", manifest([first, second]))
    verdict = load(pack)
    assert verdict["ok"] is False
    assert any("重复" in one for one in verdict["errors"]), verdict["errors"]


def test_structure_only_mode_skips_files(tmp_path):
    data = manifest([example(0)])
    verdict = validate_manifest(data)
    assert verdict["mode"] == "structure-only"
    assert verdict["ok"] is True, verdict["errors"]


# ── 反证 3：像素体检必须挡住「假图」 ───────────────────────────────────────


pytestmark_node = pytest.mark.skipif(NODE is None, reason="没有 node，跳过像素体检用例")


def run_probe(*args: str) -> dict:
    completed = subprocess.run(
        [NODE, str(REPO / "tests" / "guard-probe.mjs"), *args],
        capture_output=True,
        text=True,
        encoding="utf-8",
        cwd=str(REPO),
    )
    if completed.returncode not in (0, 1):
        raise AssertionError(f"探针自己挂了：{completed.stderr or completed.stdout}")
    return json.loads(completed.stdout.strip().splitlines()[-1])


@pytestmark_node
def test_pure_color_image_is_rejected():
    verdict = run_probe("precheck", "pure-color")
    assert verdict["ok"] is False, verdict
    codes = {one["code"] for one in verdict["problems"]}
    # 尺寸是合格的，所以拦住它的只可能是「图里没东西」。
    assert codes == {"flat"}, codes
    assert verdict["pixels"]["stdev"] < 6


@pytestmark_node
def test_gradient_image_is_rejected():
    verdict = run_probe("precheck", "gradient")
    assert verdict["ok"] is False, verdict
    codes = {one["code"] for one in verdict["problems"]}
    assert codes == {"flat"}, codes
    # 渐变最阴的地方：亮度标准差能到 70 多，只看方差就会放它过关。
    assert verdict["pixels"]["stdev"] > 40, verdict["pixels"]
    assert verdict["pixels"]["secondDiff"] < 1.1, verdict["pixels"]


@pytestmark_node
def test_photo_like_image_is_accepted():
    verdict = run_probe("precheck", "photo-like")
    assert verdict["ok"] is True, verdict
    assert verdict["pixels"]["flat"] is False


# ── 两份校验器必须给出同一个结论 ───────────────────────────────────────────


def js_validate(pack_dir: Path) -> dict:
    completed = subprocess.run(
        [NODE, str(REPO / "tests" / "guard-probe.mjs"), "validate", str(pack_dir / "manifest.json")],
        capture_output=True,
        text=True,
        encoding="utf-8",
        cwd=str(REPO),
    )
    return json.loads(completed.stdout.strip().splitlines()[-1])


@pytestmark_node
def test_js_and_python_agree(tmp_path):
    """同一批包，两份校验器必须一个说行、另一个也说行。"""
    cases = {}

    good = write_pack(tmp_path / "p-good", manifest([example(0), example(1)]))
    cases["好包"] = good

    no_review = write_pack(tmp_path / "p-noreview", manifest([example(0, reviewed=False)]))
    cases["没有复核"] = no_review

    not_listened = write_pack(tmp_path / "p-notlistened", manifest([example(0, listened=False)]))
    cases["没试听"] = not_listened

    no_media = write_pack(tmp_path / "p-nomedia", manifest([example(0, with_media=False)]))
    cases["没有媒体"] = no_media

    small = manifest([example(0)])
    small["examples"][0]["media"]["image"]["height"] = 300
    cases["图太小"] = write_pack(tmp_path / "p-small", small)

    many_variants = manifest([example(0)])
    many_variants["examples"][0]["zh_variants"] = ["一", "二", "三", "四", "五"]
    cases["中文说法太多"] = write_pack(tmp_path / "p-variants", many_variants)

    for label, pack in cases.items():
        python_verdict = load(pack)
        js_verdict = js_validate(pack)
        assert python_verdict["ok"] == js_verdict["ok"], (
            f"{label}：python 说 {python_verdict['ok']}，js 说 {js_verdict['ok']}"
            f"\n  python: {python_verdict['errors']}"
            f"\n  js: {js_verdict['errors']}"
        )


@pytestmark_node
def test_cli_exit_codes(tmp_path):
    """命令行也要能用：坏包退出码 1，好包退出码 0。"""
    good = write_pack(tmp_path / "cli-good", manifest([example(0)]))
    bad = write_pack(tmp_path / "cli-bad", manifest([example(0, reviewed=False)]))

    ok_run = subprocess.run(
        [sys.executable, str(REPO / "contract" / "validate.py"), str(good)],
        capture_output=True,
        text=True,
        encoding="utf-8",
    )
    assert ok_run.returncode == 0, ok_run.stdout + ok_run.stderr

    bad_run = subprocess.run(
        [sys.executable, str(REPO / "contract" / "validate.py"), str(bad)],
        capture_output=True,
        text=True,
        encoding="utf-8",
    )
    assert bad_run.returncode == 1
    assert json.loads(bad_run.stdout)["ok"] is False
