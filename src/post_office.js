import { PostOfficeSocket } from "./post_office_socket.js";

/**
 * PostOffice — central pub/sub and interface registry.
 * All cross-component communication routes through here.
 */

class PostOffice {

    static addSocket(_constructor, name, url, options) {
        PostOffice.sockets[name] = new PostOfficeSocket(_constructor, name, url, options);
        return PostOffice.sockets[name];
    }

    static createInterface(name, specs, override) {
        if (PostOffice.sockets[name] && !override) {
            throw new Error(`PostOffice: interface "${name}" already exists`);
        }
        PostOffice.sockets[name] = new PostOfficeSocket(EventTarget, name);
        if (specs) PostOffice.sockets[name].addInterfaceSpec(specs);
        return PostOffice.sockets[name];
    }

    static getOrCreateInterface(name, specs) {
        if (!PostOffice.sockets[name]) {
            PostOffice.sockets[name] = new PostOfficeSocket(EventTarget, name);
            if (specs) PostOffice.sockets[name].addInterfaceSpec(specs);
        }
        return PostOffice.sockets[name];
    }

    static publishToInterface(targetInterfaceAddr, msg) {
        const [socketName, opLabel] = targetInterfaceAddr.split(":::");
        const socket = PostOffice.sockets[socketName];
        if (!socket) throw new Error(`PostOffice: no interface "${socketName}"`);
        socket.publish(opLabel, msg);
    }

    static addGlobalListener(label, cb) {
        return PostOffice.sockets.global.addListener(label, cb);
    }

    static broadcastMsg(label, msg) {
        if (!label) return;
        PostOffice.sockets.global.broadcastMsg(label, msg);
    }
}

PostOffice.sockets = {};

// Global interface — always available, uses EventTarget (no real socket)
PostOffice.sockets.global = new PostOfficeSocket(EventTarget, "global");
PostOffice.sockets.global.onmessage = ev => ev;

export { PostOffice };
