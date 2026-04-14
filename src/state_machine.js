/**
 * State machine methods mixed into DOMComponent.
 * Provides stateSpace / transitionSpace / switchState.
 */

const StateMachineMethods = {

    _initStateSpace() {
        this.stateSpace = { ...this.constructor.defaultStateSpace, ...this.stateSpace };
    },

    switchState(stateName) {
        const targetState = this.stateSpace[stateName];
        if (!targetState) {
            console.warn(`Muffin: switchState — unknown state "${stateName}"`);
            return;
        }

        const prevStateName = this.current_state;

        if (!targetState.apriori.includes(prevStateName)) {
            console.warn(`Muffin: switchState — transition "${prevStateName} → ${stateName}" not permitted by apriori`);
            return;
        }

        const transitionKey = `${prevStateName} <to> ${stateName}`;
        const transition = this.transitionSpace[transitionKey];

        if (transition) {
            try {
                transition.call(this);
            } catch(e) {
                console.error(`Muffin: transition "${transitionKey}" threw —`, e);
                return;
            }
        }

        this.current_state = stateName;
        this.uiVars.state = { name: stateName, meta: targetState };
        // uiVars.state set triggers _scheduleRender automatically via Proxy

        this.interface.dispatchMessage("state-change", {
            uiVars: this.uiVars,
            data: this.data
        });

        return this.current_state;
    },

    switchToIdleState({ stateName = "idle" } = {}) {
        const targetState = this.stateSpace[stateName];
        if (!targetState) { return; }
        this.current_state = stateName;
        // NOTE: intentionally does NOT set uiVars.state here.
        // uiVars.state is set only in explicit switchState transitions.
        // switchToIdleState is a silent reset — matches v2 behaviour.
        return this.current_state;
    }
};

export { StateMachineMethods };
