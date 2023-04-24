import type { ReactiveController, ReactiveControllerHost } from 'lit';
export declare class InternalsController implements ReactiveController, ARIAMixin {
    #private;
    host: ReactiveControllerHost & HTMLElement;
    role: ARIAMixin['role'];
    ariaAtomic: ARIAMixin['ariaAtomic'];
    ariaAutoComplete: ARIAMixin['ariaAutoComplete'];
    ariaBusy: ARIAMixin['ariaBusy'];
    ariaChecked: ARIAMixin['ariaChecked'];
    ariaColCount: ARIAMixin['ariaColCount'];
    ariaColIndex: ARIAMixin['ariaColIndex'];
    ariaColIndexText: ARIAMixin['ariaColIndexText'];
    ariaColSpan: ARIAMixin['ariaColSpan'];
    ariaCurrent: ARIAMixin['ariaCurrent'];
    ariaDisabled: ARIAMixin['ariaDisabled'];
    ariaExpanded: ARIAMixin['ariaExpanded'];
    ariaHasPopup: ARIAMixin['ariaHasPopup'];
    ariaHidden: ARIAMixin['ariaHidden'];
    ariaInvalid: ARIAMixin['ariaInvalid'];
    ariaKeyShortcuts: ARIAMixin['ariaKeyShortcuts'];
    ariaLabel: ARIAMixin['ariaLabel'];
    ariaLevel: ARIAMixin['ariaLevel'];
    ariaLive: ARIAMixin['ariaLive'];
    ariaModal: ARIAMixin['ariaModal'];
    ariaMultiLine: ARIAMixin['ariaMultiLine'];
    ariaMultiSelectable: ARIAMixin['ariaMultiSelectable'];
    ariaOrientation: ARIAMixin['ariaOrientation'];
    ariaPlaceholder: ARIAMixin['ariaPlaceholder'];
    ariaPosInSet: ARIAMixin['ariaPosInSet'];
    ariaPressed: ARIAMixin['ariaPressed'];
    ariaReadOnly: ARIAMixin['ariaReadOnly'];
    ariaRequired: ARIAMixin['ariaRequired'];
    ariaRoleDescription: ARIAMixin['ariaRoleDescription'];
    ariaRowCount: ARIAMixin['ariaRowCount'];
    ariaRowIndex: ARIAMixin['ariaRowIndex'];
    ariaRowIndexText: ARIAMixin['ariaRowIndexText'];
    ariaRowSpan: ARIAMixin['ariaRowSpan'];
    ariaSelected: ARIAMixin['ariaSelected'];
    ariaSetSize: ARIAMixin['ariaSetSize'];
    ariaSort: ARIAMixin['ariaSort'];
    ariaValueMax: ARIAMixin['ariaValueMax'];
    ariaValueMin: ARIAMixin['ariaValueMin'];
    ariaValueNow: ARIAMixin['ariaValueNow'];
    ariaValueText: ARIAMixin['ariaValueText'];
    /** True when the control is disabled via it's containing fieldset element */
    get formDisabled(): boolean;
    static protos: WeakMap<object, any>;
    get labels(): NodeList;
    get validity(): ValidityState;
    constructor(host: ReactiveControllerHost & HTMLElement, options?: Partial<ARIAMixin>);
    hostConnected?(): void;
    setFormValue(...args: Parameters<ElementInternals['setFormValue']>): void;
    setValidity(...args: Parameters<ElementInternals['setValidity']>): void;
    checkValidity(...args: Parameters<ElementInternals['checkValidity']>): boolean;
    reportValidity(...args: Parameters<ElementInternals['reportValidity']>): boolean;
    submit(): void;
    reset(): void;
}