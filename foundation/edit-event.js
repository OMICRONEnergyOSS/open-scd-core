function isComplex(edit) {
    return edit instanceof Array;
}
function isInsert(edit) {
    return edit.parent !== undefined;
}
function isNamespaced(value) {
    return value !== null && typeof value !== 'string';
}
function isUpdate(edit) {
    return edit.element !== undefined;
}
function isRemove(edit) {
    return (edit.parent === undefined && edit.node !== undefined);
}
function newEditEvent(edit) {
    return new CustomEvent('oscd-edit', {
        composed: true,
        bubbles: true,
        detail: edit,
    });
}
/** EDIT HANDLING */
function localAttributeName(attribute) {
    return attribute.includes(':') ? attribute.split(':', 2)[1] : attribute;
}
function handleInsert({ parent, node, reference, }) {
    try {
        const { parentNode, nextSibling } = node;
        parent.insertBefore(node, reference);
        if (parentNode)
            return {
                node,
                parent: parentNode,
                reference: nextSibling,
            };
        return { node };
    }
    catch (e) {
        // do nothing if insert doesn't work on these nodes
        return [];
    }
}
function handleUpdate({ element, attributes }) {
    const oldAttributes = { ...attributes };
    Object.entries(attributes)
        .reverse()
        .forEach(([name, value]) => {
        var _a;
        let oldAttribute;
        if (isNamespaced(value))
            oldAttribute = {
                value: element.getAttributeNS(value.namespaceURI, localAttributeName(name)),
                namespaceURI: value.namespaceURI,
            };
        else
            oldAttribute = ((_a = element.getAttributeNode(name)) === null || _a === void 0 ? void 0 : _a.namespaceURI)
                ? {
                    value: element.getAttribute(name),
                    namespaceURI: element.getAttributeNode(name).namespaceURI,
                }
                : element.getAttribute(name);
        oldAttributes[name] = oldAttribute;
    });
    for (const entry of Object.entries(attributes)) {
        try {
            const [attribute, value] = entry;
            if (isNamespaced(value)) {
                if (value.value === null)
                    element.removeAttributeNS(value.namespaceURI, localAttributeName(attribute));
                else
                    element.setAttributeNS(value.namespaceURI, attribute, value.value);
            }
            else if (value === null)
                element.removeAttribute(attribute);
            else
                element.setAttribute(attribute, value);
        }
        catch (e) {
            // do nothing if update doesn't work on this attribute
            delete oldAttributes[entry[0]];
        }
    }
    return {
        element,
        attributes: oldAttributes,
    };
}
function handleRemove({ node }) {
    var _a;
    const { parentNode: parent, nextSibling: reference } = node;
    (_a = node.parentNode) === null || _a === void 0 ? void 0 : _a.removeChild(node);
    if (parent)
        return {
            node,
            parent,
            reference,
        };
    return [];
}
function handleEdit(edit) {
    if (isInsert(edit))
        return handleInsert(edit);
    if (isUpdate(edit))
        return handleUpdate(edit);
    if (isRemove(edit))
        return handleRemove(edit);
    if (isComplex(edit))
        return edit.map(handleEdit).reverse();
    return [];
}

export { handleEdit, isComplex, isInsert, isNamespaced, isRemove, isUpdate, newEditEvent };
//# sourceMappingURL=edit-event.js.map
