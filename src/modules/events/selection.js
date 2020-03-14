import tag from 'html-tag-js';
import helpers from '../helpers';
/**
 * 
 * @param {AceAjax.Editor} editor 
 * @param {Object} controls 
 * @param {HTMLElement} container 
 */
function textControl(editor, controls, container) {
    const $content = container.querySelector('.ace_scroller');
    let oldPos = editor.getCursorPosition();
    $content.addEventListener('contextmenu', function (e) {
        e.preventDefault();
        e.stopImmediatePropagation();
        e.stopPropagation();
        editor.focus();

        const ev = new AceMouseEvent(e, editor);
        const pos = ev.getDocumentPosition();
        editor.gotoLine(parseInt(pos.row + 1), parseInt(pos.column + 1));

        Acode.exec("select-word");
    });
    $content.addEventListener('click', function (e) {
        if (controls.callBeforeContextMenu) controls.callBeforeContextMenu();
        enableSingleMode();

        const shiftKey = tag.get('#shift-key');
        if (shiftKey && shiftKey.getAttribute('data-state') === 'on') {
            const me = new AceMouseEvent(e, editor);
            const pos = me.getDocumentPosition();
            editor.selection.setRange({
                start: oldPos,
                end: pos
            });

        } else {
            oldPos = editor.getCursorPosition();
        }
    });
}

function enableSingleMode() {
    const {
        editor,
        controls,
        container
    } = editorManager;
    const selectedText = editor.getCopyText();
    if (selectedText) return;
    const $cursor = editor.container.querySelector('.ace_cursor-layer>.ace_cursor');
    const $cm = controls.menu;
    const lineHeight = editor.renderer.lineHeight;
    const cpos = {
        x: 0,
        y: 0
    };
    const lessConent = `${editor.getReadOnly()? '' : `<span action="paste">${strings.paste}</span>`}<span action="select all">${strings["select all"]}<span>`;
    let updateTimeout;

    $cm.innerHTML = lessConent;
    if (editorManager.activeFile) editorManager.activeFile.controls = true;
    controls.update = updateEnd;
    controls.callBeforeContextMenu = callBeforeContextMenu;

    editor.on('blur', hide);
    editor.session.on('changeScrollTop', hide);
    editor.session.on('changeScrollLeft', hide);
    editor.selection.on('changeCursor', onchange);

    updateEnd();

    const mObserver = new MutationObserver(oberser);

    function oberser(list) {
        if (updateTimeout) clearTimeout(updateTimeout);
        updateEnd();
    }

    mObserver.observe($cursor, {
        attributeFilter: ['style'],
        attributes: true
    });

    if (!controls.end.isConnected) container.append(controls.end);
    controls.end.ontouchstart = function (e) {
        touchStart.call(this, e);
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
    };

    function touchStart() {
        const el = this;
        let showCm = $cm.isConnected;
        let move = false;

        document.ontouchmove = function (e) {
            e.clientY = e.touches[0].clientY - 28;
            e.clientX = e.touches[0].clientX;
            const ev = new AceMouseEvent(e, editor);
            const pos = ev.getDocumentPosition();

            editor.selection.moveCursorToPosition(pos);
            editor.selection.setSelectionAnchor(pos.row, pos.column);
            editor.renderer.scrollCursorIntoView(pos);
            if (showCm) $cm.remove();
            move = true;
        };
        document.ontouchend = function () {
            document.ontouchmove = null;
            document.ontouchend = null;
            el.touchStart = null;
            if (showCm) {
                if (editor.getCopyText()) {
                    $cm.innerHTML = controlscontrols[editor.getReadOnly() ? 'readOnlyContent' : 'fullContent'];
                } else {
                    $cm.innerHTML = lessConent;
                }
                container.appendChild($cm);
                updateCm();
            } else if (!move) {
                container.appendChild($cm);
                controls.checkForColor();
                updateCm();
            }
        };
    }

    function onchange() {
        updateTimeout = setTimeout(updateEnd, 0);
    }

    function updateEnd() {
        if (!editorManager.activeFile.controls) return controls.end.remove();
        const cursor = $cursor.getBoundingClientRect();

        cpos.x = cursor.right - 4;
        cpos.y = cursor.bottom;

        update();

    }

    function update(left = 0, top = 0) {
        const offset = parseFloat(root.style.marginLeft) || 0;
        controls.end.style.transform = `translate3d(${cpos.x + 2 + left - offset}px, ${cpos.y + top}px, 0) rotate(45deg)`;
        controls.end.style.display = 'block';
    }

    function updateCm() {
        const offset = parseFloat(root.style.marginLeft) || 0;
        const cm = {
            left: cpos.x - offset,
            top: cpos.y - (40 + lineHeight)
        };

        let scale = 1;

        $cm.style.transform = `translate3d(${cm.left}px, ${cm.top}px, 0) scale(${scale})`;

        const cmClient = $cm.getBoundingClientRect();
        if (cmClient.right + 10 > innerWidth) {
            cm.left = innerWidth - cmClient.width - 10;
        }

        if (cmClient.left < 10) {
            cm.left = 10;
        }

        if (cmClient.top < 0) {
            cm.top = 50;
        }

        //TODO: expriment
        $cm.style.transform = `translate3d(${cm.left * scale}px, ${cm.top}px, 0) scale(${scale})`;
    }

    function callBeforeContextMenu() {
        controls.end.remove();
        $cm.remove();
        $cm.innerHTML = controls[editor.getReadOnly() ? 'readOnlyContent' : 'fullContent'];
        editor.session.off('changeScrollTop', hide);
        editor.session.off('changeScrollLeft', hide);
        editor.selection.off('changeCursor', onchange);
        editor.off('blur', hide);
        mObserver.disconnect();
        controls.end.ontouchstart = null;

    }

    function hide() {
        const end = controls.end;
        if (end.isConnected) end.remove();
        if ($cm.isConnected) $cm.remove();
    }
}

export default textControl;