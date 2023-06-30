export interface WizardBase {
    subWizard?: boolean;
}
export interface CreateWizard extends WizardBase {
    parent: Element;
    tagName: string;
}
export interface EditWizard extends WizardBase {
    element: Element;
}
export declare type Wizard = CreateWizard | EditWizard;
export declare function isCreateWizard(wizard: Wizard): wizard is CreateWizard;
export declare function isEditWizard(wizard: Wizard): wizard is EditWizard;
export declare type WizardEvent = CustomEvent<Wizard>;
export declare function newWizardEvent(wizard: Wizard): WizardEvent;
declare global {
    interface ElementEventMap {
        ['oscd-wizard']: WizardEvent;
    }
}
