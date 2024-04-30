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
    return 'element' in edit && !('attributesNS' in edit);
}
function isUpdateNS(edit) {
    return 'element' in edit && 'attributesNS' in edit;
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
function uniqueNSPrefix(element, ns) {
    let i = 1;
    const attributes = Array.from(element.attributes);
    const hasSamePrefix = (attribute) => attribute.prefix === `ens${i}` && attribute.namespaceURI !== ns;
    const nsOrNull = new Set([null, ns]);
    const differentNamespace = (prefix) => !nsOrNull.has(element.lookupNamespaceURI(prefix));
    while (differentNamespace(`ens${i}`) || attributes.find(hasSamePrefix))
        i += 1;
    return `ens${i}`;
}
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
function handleUpdateNS({ element, attributes, attributesNS, }) {
    const oldAttributes = { ...attributes };
    const oldAttributesNS = { ...attributesNS };
    Object.keys(attributes)
        .reverse()
        .forEach(name => {
        oldAttributes[name] = element.getAttribute(name);
    });
    for (const entry of Object.entries(attributes)) {
        try {
            const [name, value] = entry;
            if (value === null)
                element.removeAttribute(name);
            else
                element.setAttribute(name, value);
        }
        catch (e) {
            // do nothing if update doesn't work on this attribute
            delete oldAttributes[entry[0]];
        }
    }
    Object.entries(attributesNS).forEach(([ns, attrs]) => {
        Object.keys(attrs)
            .reverse()
            .forEach(name => {
            oldAttributesNS[ns] = {
                ...oldAttributesNS[ns],
                [name]: element.getAttributeNS(ns, name),
            };
        });
    });
    for (const nsEntry of Object.entries(attributesNS)) {
        const [ns, attrs] = nsEntry;
        for (const entry of Object.entries(attrs)) {
            try {
                const [name, value] = entry;
                if (value === null)
                    element.removeAttributeNS(ns, name);
                else {
                    let qualifiedName = name;
                    if (!qualifiedName.includes(':')) {
                        let prefix = element.lookupPrefix(ns);
                        if (!prefix)
                            prefix = uniqueNSPrefix(element, ns);
                        qualifiedName = `${prefix}:${name}`;
                    }
                    element.setAttributeNS(ns, qualifiedName, value);
                }
            }
            catch (e) {
                delete oldAttributesNS[entry[0]];
            }
        }
    }
    /*
     */
    return {
        element,
        attributes: oldAttributes,
        attributesNS: oldAttributesNS,
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
    if (isUpdateNS(edit))
        return handleUpdateNS(edit);
    if (isRemove(edit))
        return handleRemove(edit);
    if (isComplex(edit))
        return edit.map(handleEdit).reverse();
    return [];
}

export { handleEdit, isComplex, isInsert, isNamespaced, isRemove, isUpdate, isUpdateNS, newEditEvent };
//# sourceMappingURL=edit-event.js.map
