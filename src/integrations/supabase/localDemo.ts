import type { Database } from './types';

type Row = Record<string, any>;
type Filter = { column: string; operator: string; value: any };

const DB_KEY = 'top-powdercoating-local-demo-v1';
const FILES_KEY = 'top-powdercoating-local-files-v1';
const SESSION_KEY = 'top-powdercoating-local-session-v1';
const DEMO_ACCOUNTS = [
  { id: 'demo-admin-user', email: 'admin@demo.local', password: 'admin123', role: 'admin', name: 'Morgan Reyes' },
  { id: 'demo-client-user', email: 'client@demo.local', password: 'client123', role: 'client', name: 'Jordan Lee' },
  { id: 'demo-team-user', email: 'ana.garcia@toppowdercoating.com', password: 'member8', role: 'team_member', name: 'Ana Garcia' },
];

const makeId = () => globalThis.crypto?.randomUUID?.() ?? `demo-${Date.now()}-${Math.random().toString(36).slice(2)}`;
const dateDaysAgo = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
};

function createSeedData() {
  const orders: Row[] = [
    { id: 'demo-order-1001', order_number: 'TPC-2026-1001', user_id: 'demo-client-user', project_name: 'Warehouse Safety Rails', description: 'Steel safety rails for a warehouse mezzanine, including corner brackets and mounting plates.', quantity: 48, dimensions: '1.2 m × 80 mm', additional_notes: 'Keep the mounting faces clear of coating.', status: 'sand-blasting', priority: 'high', progress: 25, submitted_date: dateDaysAgo(3), created_at: dateDaysAgo(3), updated_at: dateDaysAgo(1), estimated_completion: dateDaysAgo(-8), completed_date: null, quoted_price: 38400, quote_approved: true, quote_approved_at: dateDaysAgo(2) },
    { id: 'demo-order-1002', order_number: 'TPC-2026-1002', user_id: 'demo-client-user', project_name: 'Reception Desk Base', description: 'Custom fabricated steel base for a reception counter with a durable, smooth finish.', quantity: 2, dimensions: '1800 × 650 × 720 mm', additional_notes: 'Please match the submitted charcoal color sample.', status: 'pending_quote', priority: 'medium', progress: 0, submitted_date: dateDaysAgo(5), created_at: dateDaysAgo(5), updated_at: dateDaysAgo(2), estimated_completion: null, completed_date: null, quoted_price: 12800, quote_approved: false, quote_approved_at: null },
    { id: 'demo-order-1003', order_number: 'TPC-2026-1003', user_id: 'demo-client-user', project_name: 'Patio Chair Collection', description: 'Outdoor steel chair frames prepared for weather-resistant powder coating.', quantity: 12, dimensions: 'Standard dining chair', additional_notes: null, status: 'completed', priority: 'low', progress: 100, submitted_date: dateDaysAgo(22), created_at: dateDaysAgo(22), updated_at: dateDaysAgo(8), estimated_completion: dateDaysAgo(8), completed_date: dateDaysAgo(8), quoted_price: 21600, quote_approved: true, quote_approved_at: dateDaysAgo(20) },
    { id: 'demo-order-1004', order_number: 'TPC-2026-1004', user_id: 'demo-client-user', project_name: 'Garden Gate Panels', description: 'Decorative steel gate panels with a textured finish for an outdoor residential entry.', quantity: 4, dimensions: '950 × 1800 mm', additional_notes: 'Coordinate pickup with the client before dispatch.', status: 'delayed', priority: 'high', progress: 50, submitted_date: dateDaysAgo(17), created_at: dateDaysAgo(17), updated_at: dateDaysAgo(1), estimated_completion: dateDaysAgo(2), completed_date: null, quoted_price: 29200, quote_approved: true, quote_approved_at: dateDaysAgo(15) },
    { id: 'demo-order-1005', order_number: 'TPC-2026-1005', user_id: 'demo-client-2', project_name: 'Machine Guard Panels', description: 'Protective machine guard panels with a high-visibility industrial coating.', quantity: 8, dimensions: '600 × 900 mm', additional_notes: null, status: 'quality-check', priority: 'urgent', progress: 85, submitted_date: dateDaysAgo(7), created_at: dateDaysAgo(7), updated_at: dateDaysAgo(1), estimated_completion: dateDaysAgo(-2), completed_date: null, quoted_price: 47200, quote_approved: true, quote_approved_at: dateDaysAgo(6) },
    { id: 'demo-order-1006', order_number: 'TPC-2026-1006', user_id: 'demo-client-3', project_name: 'Aluminum Sign Frames', description: 'A batch of aluminum sign frames for a retail storefront renovation.', quantity: 16, dimensions: '600 × 400 mm', additional_notes: 'Keep all hanging slots free of paint.', status: 'coating', priority: 'medium', progress: 50, submitted_date: dateDaysAgo(11), created_at: dateDaysAgo(11), updated_at: dateDaysAgo(2), estimated_completion: dateDaysAgo(-5), completed_date: null, quoted_price: 18400, quote_approved: true, quote_approved_at: dateDaysAgo(10) },
  ];

  const teamMembers: Row[] = [
    { id: 'demo-team-1', name: 'Ana Garcia', role: 'Powder Coating Technician', department: 'Sand Blasting', email: DEMO_ACCOUNTS[2].email, user_id: DEMO_ACCOUNTS[2].id, status: 'active', availability: 'available', avatar_url: null, created_at: dateDaysAgo(220), updated_at: dateDaysAgo(0) },
    { id: 'demo-team-2', name: 'Marco Santos', role: 'Coating Technician', department: 'Coating', email: 'marco.santos@toppowdercoating.com', user_id: 'demo-team-user-2', status: 'active', availability: 'busy', avatar_url: null, created_at: dateDaysAgo(180), updated_at: dateDaysAgo(0) },
    { id: 'demo-team-3', name: 'Rina Cruz', role: 'Quality Inspector', department: 'Quality Control', email: 'rina.cruz@toppowdercoating.com', user_id: 'demo-team-user-3', status: 'active', availability: 'available', avatar_url: null, created_at: dateDaysAgo(95), updated_at: dateDaysAgo(0) },
    { id: 'demo-team-4', name: 'Paolo Mendoza', role: 'Curing Operator', department: 'Curing', email: 'paolo.mendoza@toppowdercoating.com', user_id: null, status: 'on_leave', availability: 'off_duty', avatar_url: null, created_at: dateDaysAgo(63), updated_at: dateDaysAgo(2) },
  ];

  return {
    orders,
    profiles: [
      { id: 'demo-admin-user', full_name: 'Morgan Reyes', company: 'TOP Powder Coating', phone: '+63 917 555 0100', created_at: dateDaysAgo(365), updated_at: dateDaysAgo(0) },
      { id: 'demo-client-user', full_name: 'Jordan Lee', company: 'Northstar Fabrication', phone: '+63 917 555 0101', created_at: dateDaysAgo(160), updated_at: dateDaysAgo(0) },
      { id: 'demo-client-2', full_name: 'Sam Rivera', company: 'Rivera Industrial Works', phone: '+63 917 555 0102', created_at: dateDaysAgo(105), updated_at: dateDaysAgo(0) },
      { id: 'demo-client-3', full_name: 'Alex Tan', company: 'Metro Retail Fixtures', phone: '+63 917 555 0103', created_at: dateDaysAgo(72), updated_at: dateDaysAgo(0) },
      { id: 'demo-team-user', full_name: 'Ana Garcia', company: 'TOP Powder Coating', phone: '+63 917 555 0104', created_at: dateDaysAgo(220), updated_at: dateDaysAgo(0) },
    ],
    user_roles: DEMO_ACCOUNTS.map((account) => ({ id: `demo-role-${account.id}`, user_id: account.id, role: account.role, created_at: dateDaysAgo(200) }))
      .concat([
        { id: 'demo-role-team-2', user_id: 'demo-team-user-2', role: 'team_member', created_at: dateDaysAgo(180) },
        { id: 'demo-role-team-3', user_id: 'demo-team-user-3', role: 'team_member', created_at: dateDaysAgo(95) },
        { id: 'demo-role-client-2', user_id: 'demo-client-2', role: 'client', created_at: dateDaysAgo(105) },
        { id: 'demo-role-client-3', user_id: 'demo-client-3', role: 'client', created_at: dateDaysAgo(72) },
      ]),
    team_members: teamMembers,
    order_team_assignments: [
      { id: 'demo-assignment-1', order_id: 'demo-order-1001', team_member_id: 'demo-team-1', assigned_at: dateDaysAgo(2) },
      { id: 'demo-assignment-2', order_id: 'demo-order-1005', team_member_id: 'demo-team-3', assigned_at: dateDaysAgo(1) },
      { id: 'demo-assignment-3', order_id: 'demo-order-1006', team_member_id: 'demo-team-2', assigned_at: dateDaysAgo(2) },
    ],
    order_customizations: [
      { id: 'demo-custom-1', order_id: 'demo-order-1001', finish: 'matte', texture: 'smooth', color: '#36454F', custom_notes: 'Charcoal gray', created_at: dateDaysAgo(3) },
      { id: 'demo-custom-2', order_id: 'demo-order-1002', finish: 'satin', texture: 'textured', color: '#20252B', custom_notes: 'Fine texture preferred', created_at: dateDaysAgo(5) },
      { id: 'demo-custom-3', order_id: 'demo-order-1003', finish: 'glossy', texture: 'smooth', color: '#1F6B4B', custom_notes: null, created_at: dateDaysAgo(22) },
      { id: 'demo-custom-4', order_id: 'demo-order-1004', finish: 'matte', texture: 'hammered', color: '#3D3D3D', custom_notes: 'Outdoor finish', created_at: dateDaysAgo(17) },
      { id: 'demo-custom-5', order_id: 'demo-order-1005', finish: 'glossy', texture: 'smooth', color: '#E34B3F', custom_notes: 'Safety red', created_at: dateDaysAgo(7) },
      { id: 'demo-custom-6', order_id: 'demo-order-1006', finish: 'satin', texture: 'smooth', color: '#D6D7D8', custom_notes: null, created_at: dateDaysAgo(11) },
    ],
    order_files: [
      { id: 'demo-file-1', order_id: 'demo-order-1001', file_name: 'rail-finish-reference.svg', file_size: 1680, file_url: '/demo-reference.svg', created_at: dateDaysAgo(3) },
    ],
    order_status_history: orders.map((order, index) => ({ id: `demo-history-${index + 1}`, order_id: order.id, status: order.status, changed_by: order.user_id, notes: 'Sample activity record', changed_at: order.updated_at })),
    quote_negotiations: [
      { id: 'demo-quote-1', order_id: 'demo-order-1002', quoted_by: 'demo-admin-user', quoted_price: 12800, notes: 'Initial estimate for the custom desk base.', status: 'pending', created_at: dateDaysAgo(2) },
      { id: 'demo-quote-2', order_id: 'demo-order-1001', quoted_by: 'demo-admin-user', quoted_price: 38400, notes: 'Quote approved by the client.', status: 'accepted', created_at: dateDaysAgo(2) },
    ],
    messages: [
      { id: 'demo-message-1', user_id: 'demo-client-user', subject: 'Quote ready', message: 'Your reception desk base quote is ready for review.', order_id: 'demo-order-1002', priority: 'medium', is_read: false, created_at: dateDaysAgo(1) },
      { id: 'demo-message-2', user_id: 'demo-admin-user', subject: 'New order received', message: 'Warehouse Safety Rails has been submitted.', order_id: 'demo-order-1001', priority: 'low', is_read: false, created_at: dateDaysAgo(2) },
    ],
    authUsers: [...DEMO_ACCOUNTS],
    nextOrderNumber: 1007,
  };
}

function loadDb(): Row {
  try {
    const stored = localStorage.getItem(DB_KEY);
    if (stored) return JSON.parse(stored);
  } catch (error) {
    console.warn('Unable to read local demo data; restoring the sample dataset.', error);
  }
  const seed = createSeedData();
  saveDb(seed);
  return seed;
}

function saveDb(db: Row) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

function getRelatedRow(db: Row, table: string, row: Row, relation: string): Row | null {
  if (table === 'order_team_assignments' && relation === 'team_members') {
    return db.team_members.find((member: Row) => member.id === row.team_member_id) ?? null;
  }
  if (table === 'order_customizations' && relation === 'orders') {
    return db.orders.find((order: Row) => order.id === row.order_id) ?? null;
  }
  return null;
}

function splitColumns(columns: string) {
  const parts: string[] = [];
  let depth = 0;
  let current = '';
  for (const character of columns) {
    if (character === '(') depth += 1;
    if (character === ')') depth -= 1;
    if (character === ',' && depth === 0) {
      parts.push(current.trim());
      current = '';
    } else current += character;
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

function projectRow(db: Row, table: string, row: Row, columns: string): Row {
  if (columns.trim() === '*' || !columns.trim()) return { ...row };
  const result: Row = {};
  for (const part of splitColumns(columns)) {
    const nested = /^([\w]+)(?:![\w]+)?\((.*)\)$/.exec(part);
    if (nested) {
      const relationName = nested[1];
      const related = getRelatedRow(db, table, row, relationName);
      result[relationName] = related ? projectRow(db, relationName, related, nested[2]) : null;
    } else if (part in row) result[part] = row[part];
  }
  return result;
}

function valueFor(row: Row, column: string) {
  return column.split('.').reduce((value: any, key) => value?.[key], row);
}

class LocalQuery implements PromiseLike<any> {
  private operation: 'select' | 'insert' | 'update' | 'delete' = 'select';
  private filters: Filter[] = [];
  private sort: Array<{ column: string; ascending: boolean }> = [];
  private maxRows: number | null = null;
  private columns = '*';
  private values: any;
  private returning = false;
  private cardinality: 'many' | 'single' | 'maybeSingle' = 'many';
  private countRequested = false;
  private headOnly = false;

  constructor(private readonly table: string) {}

  select(columns = '*', options: Row = {}) {
    this.columns = columns;
    this.returning = true;
    this.countRequested = options.count === 'exact';
    this.headOnly = Boolean(options.head);
    return this;
  }

  insert(values: any) { this.operation = 'insert'; this.values = values; return this; }
  update(values: Row) { this.operation = 'update'; this.values = values; return this; }
  delete() { this.operation = 'delete'; return this; }
  eq(column: string, value: any) { this.filters.push({ column, operator: 'eq', value }); return this; }
  neq(column: string, value: any) { this.filters.push({ column, operator: 'neq', value }); return this; }
  in(column: string, value: any[]) { this.filters.push({ column, operator: 'in', value }); return this; }
  gte(column: string, value: any) { this.filters.push({ column, operator: 'gte', value }); return this; }
  lte(column: string, value: any) { this.filters.push({ column, operator: 'lte', value }); return this; }
  gt(column: string, value: any) { this.filters.push({ column, operator: 'gt', value }); return this; }
  lt(column: string, value: any) { this.filters.push({ column, operator: 'lt', value }); return this; }
  is(column: string, value: any) { this.filters.push({ column, operator: 'eq', value }); return this; }
  order(column: string, options: Row = {}) { this.sort.push({ column, ascending: options.ascending !== false }); return this; }
  limit(value: number) { this.maxRows = value; return this; }
  single() { this.cardinality = 'single'; return this; }
  maybeSingle() { this.cardinality = 'maybeSingle'; return this; }

  private matches(row: Row, db: Row) {
    return this.filters.every(({ column, operator, value }) => {
      const actual = column.includes('.')
        ? (() => {
            const [relation, field] = column.split('.', 2);
            const related = getRelatedRow(db, this.table, row, relation);
            return related?.[field];
          })()
        : row[column];
      if (operator === 'eq') return actual === value;
      if (operator === 'neq') return actual !== value;
      if (operator === 'in') return Array.isArray(value) && value.includes(actual);
      if (operator === 'gte') return actual >= value;
      if (operator === 'lte') return actual <= value;
      if (operator === 'gt') return actual > value;
      if (operator === 'lt') return actual < value;
      return true;
    });
  }

  private async execute() {
    const db = loadDb();
    if (!Array.isArray(db[this.table])) return { data: null, error: { message: `Unknown local table: ${this.table}` } };
    let rows: Row[] = db[this.table];
    const relations = splitColumns(this.columns).map((part) => /^([\w]+)!inner\(/.exec(part)?.[1]).filter(Boolean);

    if (this.operation === 'insert') {
      const input = Array.isArray(this.values) ? this.values : [this.values];
      const now = new Date().toISOString();
      rows = input.map((value: Row) => ({
        id: value.id ?? makeId(),
        created_at: value.created_at ?? now,
        ...value,
        ...(this.table === 'orders' ? { submitted_date: value.submitted_date ?? now, updated_at: value.updated_at ?? now } : {}),
      }));
      db[this.table].push(...rows);
      saveDb(db);
    } else if (this.operation === 'select') {
      rows = rows.filter((row) => this.matches(row, db));
      if (relations.length) rows = rows.filter((row) => relations.every((relation) => getRelatedRow(db, this.table, row, relation)));
    } else {
      const matching = rows.filter((row) => this.matches(row, db));
      if (this.operation === 'update') {
        matching.forEach((row) => Object.assign(row, this.values, { updated_at: new Date().toISOString() }));
        rows = matching;
      } else {
        const ids = new Set(matching.map((row) => row.id));
        db[this.table] = db[this.table].filter((row: Row) => !ids.has(row.id));
        rows = matching;
      }
      saveDb(db);
    }

    const count = rows.length;
    for (const sort of this.sort) {
      rows = [...rows].sort((a, b) => {
        const left = valueFor(a, sort.column) ?? '';
        const right = valueFor(b, sort.column) ?? '';
        const comparison = left < right ? -1 : left > right ? 1 : 0;
        return sort.ascending ? comparison : -comparison;
      });
    }
    if (this.maxRows !== null) rows = rows.slice(0, this.maxRows);
    const data = this.operation === 'delete' && !this.returning
      ? null
      : rows.map((row) => projectRow(db, this.table, row, this.columns));
    if (this.headOnly) return { data: null, error: null, count };
    if (this.cardinality === 'single') {
      if (!data?.length) return { data: null, error: { message: 'No rows found' } };
      return { data: data[0], error: null, count };
    }
    if (this.cardinality === 'maybeSingle') return { data: data?.[0] ?? null, error: null, count };
    return { data, error: null, count };
  }

  then<TResult1 = any, TResult2 = never>(
    onfulfilled?: ((value: any) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }
}

function currentUser(db = loadDb()) {
  const userId = localStorage.getItem(SESSION_KEY);
  const account = db.authUsers.find((entry: Row) => entry.id === userId);
  if (!account) return null;
  return {
    id: account.id,
    email: account.email,
    aud: 'authenticated',
    role: 'authenticated',
    app_metadata: { provider: 'email', providers: ['email'], role: account.role },
    user_metadata: { full_name: account.name, company: account.company ?? null, phone: account.phone ?? null },
    created_at: account.created_at ?? dateDaysAgo(100),
  };
}

function currentSession() {
  const user = currentUser();
  if (!user) return null;
  return {
    access_token: `local-demo-${user.id}`,
    token_type: 'bearer',
    expires_in: 60 * 60 * 24 * 365,
    expires_at: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365,
    refresh_token: `local-refresh-${user.id}`,
    user,
  };
}

const authListeners = new Set<(event: string, session: any) => void>();
function emitAuth(event: string) {
  const session = currentSession();
  authListeners.forEach((listener) => listener(event, session));
}

function localAuth() {
  return {
    onAuthStateChange(callback: (event: string, session: any) => void) {
      authListeners.add(callback);
      queueMicrotask(() => callback('INITIAL_SESSION', currentSession()));
      return { data: { subscription: { unsubscribe: () => authListeners.delete(callback) } } };
    },
    async getSession() { return { data: { session: currentSession() }, error: null }; },
    async getUser() { return { data: { user: currentUser() }, error: null }; },
    async signInWithPassword({ email, password }: { email: string; password: string }) {
      const db = loadDb();
      const account = db.authUsers.find((entry: Row) => entry.email.toLowerCase() === email.toLowerCase() && entry.password === password);
      if (!account) return { data: { user: null, session: null }, error: { message: 'Invalid login credentials' } };
      localStorage.setItem(SESSION_KEY, account.id);
      emitAuth('SIGNED_IN');
      return { data: { user: currentUser(db), session: currentSession() }, error: null };
    },
    async signUp({ email, password, options }: { email: string; password: string; options?: Row }) {
      const db = loadDb();
      if (db.authUsers.some((entry: Row) => entry.email.toLowerCase() === email.toLowerCase())) {
        return { data: { user: null, session: null }, error: { message: 'User already registered' } };
      }
      const metadata = options?.data ?? {};
      const account = { id: makeId(), email, password, role: 'client', name: metadata.full_name || email.split('@')[0], company: metadata.company || '', phone: metadata.phone || '', created_at: new Date().toISOString() };
      db.authUsers.push(account);
      db.user_roles.push({ id: makeId(), user_id: account.id, role: 'client', created_at: new Date().toISOString() });
      db.profiles.push({ id: account.id, full_name: account.name, company: account.company, phone: account.phone, created_at: account.created_at, updated_at: account.created_at });
      saveDb(db);
      return { data: { user: { id: account.id, email, user_metadata: metadata }, session: null }, error: null };
    },
    async signOut() {
      localStorage.removeItem(SESSION_KEY);
      emitAuth('SIGNED_OUT');
      return { error: null };
    },
  };
}

function localStorageApi() {
  return {
    from(bucket: string) {
      return {
        async upload(path: string, file: File) {
          try {
            const dataUrl = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('File read failed'));
              reader.onerror = () => reject(reader.error);
              reader.readAsDataURL(file);
            });
            const stored = JSON.parse(localStorage.getItem(FILES_KEY) || '{}');
            stored[`${bucket}/${path}`] = dataUrl;
            localStorage.setItem(FILES_KEY, JSON.stringify(stored));
            return { data: { path }, error: null };
          } catch (error: any) {
            return { data: null, error: { message: error?.message || 'Unable to save file in this browser' } };
          }
        },
        getPublicUrl(path: string) {
          const stored = JSON.parse(localStorage.getItem(FILES_KEY) || '{}');
          return { data: { publicUrl: stored[`${bucket}/${path}`] || '/demo-reference.svg' } };
        },
        async remove(paths: string[]) {
          const stored = JSON.parse(localStorage.getItem(FILES_KEY) || '{}');
          paths.forEach((path) => delete stored[`${bucket}/${path}`]);
          localStorage.setItem(FILES_KEY, JSON.stringify(stored));
          return { data: paths.map((path) => ({ name: path })), error: null };
        },
      };
    },
  };
}

function localFunctions() {
  return {
    async invoke(name: string, options: Row = {}) {
      const body = options.body ?? {};
      const db = loadDb();
      if (name === 'create-team-member-account') {
        const member = db.team_members.find((entry: Row) => entry.id === body.teamMemberId);
        if (!member) return { data: null, error: { message: 'Team member not found' } };
        if (db.authUsers.some((entry: Row) => entry.email.toLowerCase() === String(body.email).toLowerCase())) return { data: null, error: { message: 'Email already exists' } };
        const account = { id: makeId(), email: body.email, password: body.password, role: 'team_member', name: body.fullName || member.name, created_at: new Date().toISOString() };
        db.authUsers.push(account);
        db.user_roles.push({ id: makeId(), user_id: account.id, role: 'team_member', created_at: new Date().toISOString() });
        Object.assign(member, { user_id: account.id, email: account.email });
        saveDb(db);
        return { data: { success: true, email: account.email }, error: null };
      }
      if (name === 'update-team-member-credentials') {
        const account = db.authUsers.find((entry: Row) => entry.id === body.userId);
        if (account) {
          if (body.email) account.email = body.email;
          if (body.password) account.password = body.password;
        }
        const member = db.team_members.find((entry: Row) => entry.id === body.teamMemberId);
        if (member && body.email) member.email = body.email;
        saveDb(db);
        return { data: { success: true }, error: null };
      }
      if (name === 'batch-create-team-accounts') {
        const results = db.team_members.filter((member: Row) => !member.user_id).map((member: Row, index: number) => {
          const prefix = member.name.toLowerCase().trim().replace(/\s+/g, '.');
          const email = member.email || `${prefix}@toppowdercoating.com`;
          const password = `member${db.team_members.indexOf(member) + 1}`;
          const account = { id: makeId(), email, password, role: 'team_member', name: member.name, created_at: new Date().toISOString() };
          db.authUsers.push(account);
          db.user_roles.push({ id: makeId(), user_id: account.id, role: 'team_member', created_at: new Date().toISOString() });
          Object.assign(member, { user_id: account.id, email });
          return { success: true, name: member.name, email, password, index };
        });
        saveDb(db);
        return { data: { results }, error: null };
      }
      if (name === 'send-order-notification') {
        db.messages.push({ id: makeId(), user_id: body.user_id, subject: body.subject || 'Order update', message: body.message || 'An order has been updated.', order_id: body.order_id || null, priority: body.priority || 'medium', is_read: false, created_at: new Date().toISOString() });
        saveDb(db);
        return { data: { success: true, local: true }, error: null };
      }
      return { data: { success: true, local: true }, error: null };
    },
  };
}

const localClient = {
  auth: localAuth(),
  from: (table: keyof Database['public']['Tables'] | string) => new LocalQuery(String(table)),
  rpc: async (name: string) => {
    if (name === 'generate_order_number') {
      const db = loadDb();
      const orderNumber = `TPC-2026-${db.nextOrderNumber++}`;
      saveDb(db);
      return { data: orderNumber, error: null };
    }
    return { data: null, error: null };
  },
  storage: localStorageApi(),
  functions: localFunctions(),
  channel: () => ({ on() { return this; }, subscribe() { return this; } }),
  removeChannel: async () => 'ok',
};

export const localDemoSupabase = localClient as unknown as import('@supabase/supabase-js').SupabaseClient<Database>;

export function resetLocalDemoData() {
  localStorage.removeItem(DB_KEY);
  localStorage.removeItem(FILES_KEY);
  localStorage.removeItem(SESSION_KEY);
  const seed = createSeedData();
  saveDb(seed);
}

export const localDemoCredentials = DEMO_ACCOUNTS.map(({ email, password, role, name }) => ({ email, password, role, name }));