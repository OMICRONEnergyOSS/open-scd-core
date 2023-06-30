function isCreateWizard(wizard) {
    return 'parent' in wizard;
}
function isEditWizard(wizard) {
    return 'element' in wizard;
}
function newWizardEvent(wizard) {
    return new CustomEvent('oscd-wizard', {
        composed: true,
        bubbles: true,
        detail: wizard,
    });
}

export { isCreateWizard, isEditWizard, newWizardEvent };
//# sourceMappingURL=wizard-event.js.map
