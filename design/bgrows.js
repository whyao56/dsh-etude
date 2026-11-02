/* 背景那几条：就地编辑 / 删 / 加（只有工厂页有这些节点） */
(function () {
  document.addEventListener('click', function (event) {
    var del = event.target.closest('[data-bgdel]');
    if (del) {
      var li = del.closest('li');
      if (li) li.remove();
      event.stopPropagation();
      return;
    }
    var add = event.target.closest('[data-bgadd]');
    if (add) {
      var list = document.getElementById('bglList');
      if (!list) return;
      var li2 = document.createElement('li');
      li2.innerHTML = '<b>新一条</b><span contenteditable="true">写一句</span>' +
        '<span class="bops"><button type="button" data-bgedit title="编辑">✎</button>' +
        '<button type="button" data-bgdel title="删掉">−</button></span>';
      list.appendChild(li2);
      var body = li2.querySelector('span[contenteditable]');
      if (body) {
        body.focus();
        var r = document.createRange();
        r.selectNodeContents(body);
        var sel = window.getSelection();
        if (sel) { sel.removeAllRanges(); sel.addRange(r); }
      }
      event.stopPropagation();
      return;
    }
    var edit = event.target.closest('[data-bgedit]');
    if (edit) {
      var row = edit.closest('li');
      var cell = row ? row.querySelector('span:not(.bops)') : null;
      if (!cell) return;
      var on = cell.getAttribute('contenteditable') !== 'true';
      cell.setAttribute('contenteditable', on ? 'true' : 'false');
      edit.textContent = on ? '✓' : '✎';
      if (on) cell.focus();
      event.stopPropagation();
    }
  });
})();
