# Element Framework (Muffin)

A lightweight, vanilla JavaScript framework for building modern User Interfaces with message-driven component-based architecture and flexible data management.

## Overview

Element Framework (internally called "Muffin") is a minimalistic frontend framework that provides:

- **Component-based architecture** with Web Components
- **Client-side routing** for SPAs
- **Real-time data synchronization** via WebSockets
- **Local storage integration** with IndexedDB
- **Template inclusion system** for modular HTML
- **Event-driven communication** between components

## Quick Start

### Installation

**Install in your project:**
```bash
npm i --save github:FootLooseLabs/element
```

Then include the framework in your `index.src.html`:
```html
<script src="./node_modules/muffin/dist/muffin.min.js"></script>
```

**Project structure:**
   ```
   my-project/
   ├── src/
   │   ├── assets/
   │   ├── components/
   │   ├── pages/
   │   ├── index.src.html
   │   └── sw.js
   ├── gulpfile.js
   ├── package.json
   ├── .gitignore
   └── .babelrc
   ```

## Core Concepts

### 1. Components (DOMComponent)

Components are custom HTML elements that encapsulate data, markup, and behavior.

```javascript
class ContactCard extends Muffin.DOMComponent {
    static domElName = "contact-card"

    static schema = {
        "name": "",
        "email": "",
        "phone_no": ""
    }

    static markupFunc = (data) => {
        return `
            <h1>${data.name}</h1>
            <h3 class="contact">
                ${data.email}<br/>
                ${data.phone_no}
            </h3>
            <button on-click="handleEdit">Edit Contact</button>
        `
    }

    handleEdit(event) {
        console.log("Editing contact:", this.data.name);
        // Handle edit logic
    }
}

customElements.define(ContactCard.domElName, ContactCard)
```

**Key Properties:**
- `domElName`: HTML tag name for the component
- `schema`: Default data structure
- `markupFunc`: Function that renders data into HTML
- `stateSpace`: Component state management
- `interfaces`: External API definitions

### 2. Data Management (DataSource)

DataSource handles data persistence, real-time updates, and local caching.

```html
<contact-card>
    <component-data socket="websocket-name" label="contact-data">
        {
            "name": "John Doe",
            "email": "john@example.com",
            "phone_no": "+1234567890"
        }
    </component-data>
</contact-card>
```

**Features:**
- Automatic IndexedDB persistence
- WebSocket real-time updates
- JSON fixture loading
- Data normalization and validation

### 3. Routing (Router)

Client-side routing for single-page applications with nested route support.

```html
<div route="home">
    <h1>Home Page</h1>
    <button onclick="_router.go('about')">About</button>
</div>

<div route="about">
    <h1>About Page</h1>
    <button onclick="_router.go('home')">Home</button>
</div>

<script>
    var _router = new Router();
    document.addEventListener('DOMContentLoaded', () => {
        _router.go('home');
    });
</script>
```

**Router Features:**
- Declarative route definitions with `route` attributes
- Nested routing with `sub-route`
- URL parameter handling
- History API integration
- Programmatic navigation

### 4. Real-time Communication (PostOffice)

Event-driven messaging system supporting WebSockets and local events.

```javascript
// Create a WebSocket connection
var socket = PostOffice.addSocket(WebSocket, "api", "ws://localhost:8080");

// Listen for messages
socket.addListener("user-update", (data) => {
    console.log("User updated:", data);
});

// Send messages
socket.sendMsg({
    lexemeName: "updateUser",
    msg: { id: 1, name: "Jane Doe" }
});
```

### 5. Template Inclusion

Modular HTML templates for better code organization.

```html
<!-- index.src.html -->
<div route="contact">
    <include src="pages/contact.html"></include>
</div>

<!-- pages/contact.html -->
<template>
    <style>
        .contact-container { padding: 20px; }
    </style>
    <div class="contact-container">
        <contact-card>
            <component-data label="contact-info">
                {"name": "Alice", "email": "alice@example.com"}
            </component-data>
        </contact-card>
    </div>
</template>
```

### 6. Event Handling

Components support `on-<eventname>` attributes in markup for direct event binding.

```javascript
class InteractiveCard extends Muffin.DOMComponent {
    static domElName = "interactive-card"

    static schema = {
        title: "",
        count: 0
    }

    static markupFunc = (data) => {
        return `
            <div class="card">
                <h2>${data.title}</h2>
                <p>Count: ${data.count}</p>
                <button on-click="increment">+</button>
                <button on-click="decrement">-</button>
                <input on-input="updateTitle" placeholder="Update title" />
                <div on-mouseenter="highlight" on-mouseleave="unhighlight">
                    Hover me!
                </div>
            </div>
        `
    }

    increment(event) {
        this.data.count++;
        this.render();
    }

    decrement(event) {
        this.data.count--;
        this.render();
    }

    updateTitle(event) {
        this.data.title = event.target.value;
    }

    highlight(event) {
        event.target.style.backgroundColor = '#f0f0f0';
    }

    unhighlight(event) {
        event.target.style.backgroundColor = '';
    }
}
```

## Built-in Elements

### Custom Tags
- `<include src="path/to/template.html">` - Include external templates
- `<component-data socket="name" label="key">` - Component data binding

### HTML Attributes
- `route="route-name"` - Define routes for SPA navigation
- `sub-route` - Mark nested routes
- `on-<eventname>="methodName"` - Bind DOM events to component methods

### CSS Classes
- `.page` - Default page styling
- `._active` - Active route indicator (customizable)

## Advanced Features

### Component Lifecycle

Components have built-in lifecycle methods:

```javascript
class MyComponent extends Muffin.DOMComponent {
    static domElName = "my-component"

    connectedCallback() {
        // Called when component is added to DOM
        console.log("Component mounted");
    }

    onDomContentLoaded() {
        // Called when DOM is ready
        this.initializeComponent();
    }

    switchState(newState) {
        // Handle state transitions
        console.log("State changed to:", newState);
    }
}
```

### Interface System

Components can expose interfaces for external communication:

```javascript
class APIComponent extends Muffin.DOMComponent {
    static domElName = "api-component"
    static advertiseAs = "UserAPI"

    static LEXICON = {
        getUser: {
            schema: { subscribe: true },
            inflect: (data) => ({ action: "get_user", ...data })
        },
        updateUser: {
            schema: {},
            inflect: (data) => ({ action: "update_user", ...data })
        }
    }

    getUser(request) {
        // Handle get user requests
    }

    updateUser(request) {
        // Handle update user requests
    }
}
```

### State Management

Components can define state spaces and transitions:

```javascript
class StatefulComponent extends Muffin.DOMComponent {
    static domElName = "stateful-component"

    static stateSpace = {
        "loading": { apriori: ["idle"] },
        "loaded": { apriori: ["loading"] },
        "error": { apriori: ["loading"] }
    }

    async loadData() {
        this.switchState("loading");
        try {
            const data = await this.fetchData();
            this.data = data;
            this.switchState("loaded");
        } catch (error) {
            this.switchState("error");
        }
    }
}
```

## Configuration

Framework configuration in your application:

```javascript
// Custom configuration
window.Muffin = {
    DEBUG_SCOPE: { _debugCmp: null },
    DB_NAME: "MyApp",
    DB_VERSION: 1.0
};
```

## Development Workflow

1. **Create components** in `src/components/` directory
2. **Define pages** in `src/pages/` directory using templates
3. **Set up routes** in your main HTML file
4. **Configure data sources** with WebSocket connections
5. **Build and test** your application

## Browser Support

- Modern browsers supporting Web Components
- ES6+ features required
- IndexedDB for local storage
- WebSocket API for real-time features

## Architecture Benefits

- **Lightweight**: Minimal framework overhead
- **Modular**: Component-based architecture
- **Flexible**: No rigid conventions, adaptable to needs
- **Real-time**: Built-in WebSocket support
- **Offline-capable**: Local storage integration
- **SEO-friendly**: Server-side rendering possible

## Global API Reference

The framework exposes the `window.Muffin` namespace containing:

- `window.Muffin.DOMComponent` - Base component class
- `window.Muffin.Router` - Client-side router
- `window.Muffin.PostOffice` - Messaging system
- `window.Muffin.DataSource` - Data management
- `window.Muffin.Lexeme` - Message structure system
- `window.Muffin.Introspector` - Component introspection utilities
- `window.Muffin.DOMComponentRegistry` - Component registration system

Legacy globals (for backward compatibility):
- `window.Router` - Alias for `window.Muffin.Router`
- `window.PostOffice` - Alias for `window.Muffin.PostOffice`
- `window.DataSource` - Alias for `window.Muffin.DataSource`
- `window.DOMComponent` - Alias for `window.Muffin.DOMComponent`

---

Element Framework is designed to be implementation-flexible and lightweight. When contributing:

1. Maintain minimal dependencies
2. Preserve vanilla JavaScript approach
3. Ensure backward compatibility
4. Add comprehensive tests
