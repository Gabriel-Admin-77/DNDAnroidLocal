// Local storage-based client replacement for Supabase
// This allows the app to run fully offline without any backend

const DB_PREFIX = 'dnd_app_';

function generateId(): string {
    return 'loc_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);
}

function getTable<T>(tableName: string): T[] {
    try {
        const raw = localStorage.getItem(DB_PREFIX + tableName);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function setTable<T>(tableName: string, data: T[]): void {
    localStorage.setItem(DB_PREFIX + tableName, JSON.stringify(data));
}

function getLocalUser(): { id: string; email: string } {
    try {
        const raw = localStorage.getItem(DB_PREFIX + 'auth_user');
        if (raw) return JSON.parse(raw);
        const defaultUser = { id: 'local_user_default', email: 'adventurer@local.dnd' };
        setLocalUser(defaultUser);
        return defaultUser;
    } catch {
        return { id: 'local_user_default', email: 'adventurer@local.dnd' };
    }
}


function setLocalUser(user: { id: string; email: string } | null): void {
    if (user) {
        localStorage.setItem(DB_PREFIX + 'auth_user', JSON.stringify(user));
    } else {
        localStorage.removeItem(DB_PREFIX + 'auth_user');
    }
}

class LocalQuery {
    private table: string;
    private filters: ((item: Record<string, unknown>) => boolean)[] = [];
    private _limitCount?: number;

    constructor(table: string) {
        this.table = table;
    }

    select(_columns?: string) {
        return this;
    }

    eq(field: string, value: unknown) {
        this.filters.push((item) => String(item[field]) === String(value));
        return this;
    }

    in(field: string, values: unknown[]) {
        this.filters.push((item) => values.includes(item[field]));
        return this;
    }

    limit(count: number) {
        this._limitCount = count;
        return this;
    }

    single() {
        let result = getTable<Record<string, unknown>>(this.table).filter((item) =>
            this.filters.every((f) => f(item))
        );
        if (this._limitCount) result = result.slice(0, this._limitCount);
        return Promise.resolve({ data: result[0] ?? null, error: null });
    }

    then(resolve?: (result: { data: Record<string, unknown>[]; error: null }) => void) {
        let result = getTable<Record<string, unknown>>(this.table).filter((item) =>
            this.filters.every((f) => f(item))
        );
        if (this._limitCount) result = result.slice(0, this._limitCount);
        const res = { data: result, error: null };
        if (resolve) resolve(res);
        return Promise.resolve(res);
    }
}

class LocalInsertQuery {
    private table: string;
    private rows: Record<string, unknown>[];

    constructor(table: string, rows: Record<string, unknown>[]) {
        this.table = table;
        this.rows = rows;
    }

    select() {
        return this;
    }

    single() {
        return this.then();
    }

    then(resolve?: (result: { data: Record<string, unknown>[]; error: null }) => void) {
        const existing = getTable<Record<string, unknown>>(this.table);
        const newRows = this.rows.map((row) => ({
            ...row,
            id: row.id || generateId(),
            created_at: new Date().toISOString(),
        }));
        setTable(this.table, [...existing, ...newRows]);
        const res = { data: newRows, error: null };
        if (resolve) resolve(res);
        return Promise.resolve(res);
    }
}

class LocalUpdateQuery {
    private table: string;
    private updates: Record<string, unknown>;
    private filters: ((item: Record<string, unknown>) => boolean)[] = [];

    constructor(table: string, updates: Record<string, unknown>) {
        this.table = table;
        this.updates = updates;
    }

    eq(field: string, value: unknown) {
        this.filters.push((item) => item[field] === value);
        return this;
    }

    in(field: string, values: unknown[]) {
        this.filters.push((item) => values.includes(item[field]));
        return this;
    }

    then(resolve?: (result: { data: null; error: null }) => void) {
        const existing = getTable<Record<string, unknown>>(this.table);
        const updated = existing.map((item) => {
            if (this.filters.every((f) => f(item))) {
                return { ...item, ...this.updates };
            }
            return item;
        });
        setTable(this.table, updated);
        const res = { data: null, error: null };
        if (resolve) resolve(res);
        return Promise.resolve(res);
    }
}

class LocalDeleteQuery {
    private table: string;
    private filters: ((item: Record<string, unknown>) => boolean)[] = [];

    constructor(table: string) {
        this.table = table;
    }

    eq(field: string, value: unknown) {
        this.filters.push((item) => item[field] === value);
        return this;
    }

    in(field: string, values: unknown[]) {
        this.filters.push((item) => values.includes(item[field]));
        return this;
    }

    then(resolve?: (result: { data: null; error: null }) => void) {
        const existing = getTable<Record<string, unknown>>(this.table);
        const filtered = existing.filter((item) => !this.filters.every((f) => f(item)));
        setTable(this.table, filtered);
        const res = { data: null, error: null };
        if (resolve) resolve(res);
        return Promise.resolve(res);
    }
}

class LocalTable {
    private tableName: string;

    constructor(tableName: string) {
        this.tableName = tableName;
    }

    select(_columns?: string) {
        return new LocalQuery(this.tableName);
    }

    insert(rows: Record<string, unknown>[]) {
        return new LocalInsertQuery(this.tableName, rows);
    }

    update(updates: Record<string, unknown>) {
        return new LocalUpdateQuery(this.tableName, updates);
    }

    delete() {
        return new LocalDeleteQuery(this.tableName);
    }
}

class LocalChannel {
    on() { return this; }
    subscribe() { return {}; }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let client: any = null;

export function createClient() {
    if (client) return client;

    client = {
        auth: {
            getUser: async () => {
                const user = getLocalUser();
                return { data: { user }, error: null };
            },
            signInWithPassword: async ({ email }: { email: string; password: string }) => {
                const userId = 'local_user_' + email.replace(/[^a-z0-9]/gi, '_');
                const user = { id: userId, email };
                setLocalUser(user);
                return { data: { user, session: { access_token: 'local' } }, error: null };
            },
            signUp: async ({ email }: { email: string; password: string }) => {
                const userId = 'local_user_' + email.replace(/[^a-z0-9]/gi, '_');
                const user = { id: userId, email };
                setLocalUser(user);
                return { data: { user, session: { access_token: 'local' } }, error: null };
            },
        },
        from: (table: string) => new LocalTable(table),
        channel: (_name: string) => new LocalChannel(),
        removeChannel: (_channel: LocalChannel) => {},
    };

    return client;
}
