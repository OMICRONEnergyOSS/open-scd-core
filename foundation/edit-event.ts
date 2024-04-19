/** Intent to `parent.insertBefore(node, reference)` */
export type Insert = {
  parent: Node;
  node: Node;
  reference: Node | null;
};

export type NamespacedAttributeValue = {
  value: string | null;
  namespaceURI: string | null;
};
export type Value = string | null;
export type AttributeValue = Value | NamespacedAttributeValue;
/**
 * Intent to set or remove (if null) attributes on element
 * @deprecated - use `UpdateNS` for updating namespaced attributes instead.
 */
export type Update = {
  element: Element;
  attributes: Partial<Record<string, AttributeValue>>;
};

/** Intent to set or remove (if null) attributes on element */
export type UpdateNS = {
  element: Element;
  attributes: Partial<Record<string, Value>>;
  attributesNS: Partial<Record<string, Partial<Record<string, Value>>>>;
};

/** Intent to remove a node from its ownerDocument */
export type Remove = {
  node: Node;
};

/** Represents the user's intent to change an XMLDocument */
export type Edit = Insert | Update | UpdateNS | Remove | Edit[];

export function isComplex(edit: Edit): edit is Edit[] {
  return edit instanceof Array;
}

export function isInsert(edit: Edit): edit is Insert {
  return (edit as Insert).parent !== undefined;
}

export function isNamespaced(
  value: AttributeValue
): value is NamespacedAttributeValue {
  return value !== null && typeof value !== 'string';
}

export function isUpdate(edit: Edit): edit is Update {
  return 'element' in edit && !('attributesNS' in edit);
}

export function isUpdateNS(edit: Edit): edit is UpdateNS {
  return 'element' in edit && 'attributesNS' in edit;
}

export function isRemove(edit: Edit): edit is Remove {
  return (
    (edit as Insert).parent === undefined && (edit as Remove).node !== undefined
  );
}

export type EditEvent<E extends Edit = Edit> = CustomEvent<E>;

export function newEditEvent<E extends Edit>(edit: E): EditEvent<E> {
  return new CustomEvent<E>('oscd-edit', {
    composed: true,
    bubbles: true,
    detail: edit,
  });
}

declare global {
  interface ElementEventMap {
    ['oscd-edit']: EditEvent;
  }
}

/** EDIT HANDLING */

function uniqueNSPrefix(element: Element, ns: string): string {
  let i = 1;
  const attributes = Array.from(element.attributes);
  const hasSamePrefix = (attribute: Attr) =>
    attribute.prefix === `ens${i}` && attribute.namespaceURI !== ns;
  const nsOrNull = new Set([null, ns]);
  const differentNamespace = (prefix: string) =>
    !nsOrNull.has(element.lookupNamespaceURI(prefix));
  while (differentNamespace(`ens${i}`) || attributes.find(hasSamePrefix))
    i += 1;
  return `ens${i}`;
}

function localAttributeName(attribute: string): string {
  return attribute.includes(':') ? attribute.split(':', 2)[1] : attribute;
}

function handleInsert({
  parent,
  node,
  reference,
}: Insert): Insert | Remove | [] {
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
  } catch (e) {
    // do nothing if insert doesn't work on these nodes
    return [];
  }
}

function handleUpdate({ element, attributes }: Update): Update {
  const oldAttributes = { ...attributes };
  Object.entries(attributes)
    .reverse()
    .forEach(([name, value]) => {
      let oldAttribute: AttributeValue;
      if (isNamespaced(value!))
        oldAttribute = {
          value: element.getAttributeNS(
            value.namespaceURI,
            localAttributeName(name)
          ),
          namespaceURI: value.namespaceURI,
        };
      else
        oldAttribute = element.getAttributeNode(name)?.namespaceURI
          ? {
              value: element.getAttribute(name),
              namespaceURI: element.getAttributeNode(name)!.namespaceURI!,
            }
          : element.getAttribute(name);
      oldAttributes[name] = oldAttribute;
    });
  for (const entry of Object.entries(attributes)) {
    try {
      const [attribute, value] = entry as [string, AttributeValue];
      if (isNamespaced(value)) {
        if (value.value === null)
          element.removeAttributeNS(
            value.namespaceURI,
            localAttributeName(attribute)
          );
        else element.setAttributeNS(value.namespaceURI, attribute, value.value);
      } else if (value === null) element.removeAttribute(attribute);
      else element.setAttribute(attribute, value);
    } catch (e) {
      // do nothing if update doesn't work on this attribute
      delete oldAttributes[entry[0]];
    }
  }
  return {
    element,
    attributes: oldAttributes,
  };
}

function handleUpdateNS({
  element,
  attributes,
  attributesNS,
}: UpdateNS): UpdateNS {
  const oldAttributes = { ...attributes };
  const oldAttributesNS = { ...attributesNS };
  Object.keys(attributes)
    .reverse()
    .forEach(name => {
      oldAttributes[name] = element.getAttribute(name);
    });
  for (const entry of Object.entries(attributes)) {
    try {
      const [name, value] = entry as [string, Value];
      if (value === null) element.removeAttribute(name);
      else element.setAttribute(name, value);
    } catch (e) {
      // do nothing if update doesn't work on this attribute
      delete oldAttributes[entry[0]];
    }
  }
  Object.entries(attributesNS).forEach(([ns, attrs]) => {
    Object.keys(attrs!)
      .reverse()
      .forEach(name => {
        oldAttributesNS[ns] = {
          ...oldAttributesNS[ns],
          [name]: element.getAttributeNS(ns, name),
        };
      });
  });
  for (const nsEntry of Object.entries(attributesNS)) {
    const [ns, attrs] = nsEntry as [string, Partial<Record<string, Value>>];
    for (const entry of Object.entries(attrs)) {
      try {
        const [name, value] = entry as [string, Value];
        if (value === null) element.removeAttributeNS(ns, name);
        else {
          let qualifiedName = name;
          if (!qualifiedName.includes(':')) {
            let prefix = element.lookupPrefix(ns);
            if (!prefix) prefix = uniqueNSPrefix(element, ns);
            qualifiedName = `${prefix}:${name}`;
          }
          element.setAttributeNS(ns, qualifiedName, value);
        }
      } catch (e) {
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

function handleRemove({ node }: Remove): Insert | [] {
  const { parentNode: parent, nextSibling: reference } = node;
  node.parentNode?.removeChild(node);
  if (parent)
    return {
      node,
      parent,
      reference,
    };
  return [];
}

export function handleEdit(edit: Edit): Edit {
  if (isInsert(edit)) return handleInsert(edit);
  if (isUpdate(edit)) return handleUpdate(edit);
  if (isUpdateNS(edit)) return handleUpdateNS(edit);
  if (isRemove(edit)) return handleRemove(edit);
  if (isComplex(edit)) return edit.map(handleEdit).reverse();
  return [];
}
