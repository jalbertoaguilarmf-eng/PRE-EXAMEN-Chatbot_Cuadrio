import './bootstrap';
import DOMPurify from 'dompurify';
import { marked } from 'marked';

const state = {
    clients: [],
    indicators: {},
    businessDate: null,
    status: 'all',
    search: '',
    statusFilter: '',
    obligationFilter: '',
    ownerFilter: '',
    regimeFilter: '',
    page: 1,
    pageSize: 10,
    view: 'table',
    history: [],
    loading: false,
};

const $ = (selector) => document.querySelector(selector);
const api = window.cuadrioConfig;
const moneyFormatter = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });
const numberFormatter = new Intl.NumberFormat('es-MX');

function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (character) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
    })[character]);
}

function number(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
}

function dateLabel(value, options = { day: '2-digit', month: 'short' }) {
    if (!value) return 'Sin fecha';
    const date = new Date(`${String(value).slice(0, 10)}T12:00:00`);
    return Number.isNaN(date.getTime()) ? String(value) : new Intl.DateTimeFormat('es-MX', options).format(date);
}

function money(value) {
    return moneyFormatter.format(number(value));
}

function initials(value) {
    return String(value || '?')
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0] || '')
        .join('')
        .toUpperCase();
}

function statusClass(value) {
    const status = String(value || '').toLowerCase();
    if (status.includes('validado') || status.includes('dispersión') || status.includes('corriente')) return 'good';
    if (status.includes('pendiente') || status.includes('falta') || status.includes('vencer')) return 'warn';
    if (status.includes('mora') || status.includes('rechazado') || status.includes('vencido')) return 'bad';
    return 'neutral';
}

function isUrgent(client) {
    if (client.vencimiento_urgente !== null && client.vencimiento_urgente !== undefined) {
        return client.vencimiento_urgente === true || Number(client.vencimiento_urgente) === 1;
    }

    const days = Number(client.dias_para_vencer);
    return Number.isFinite(days) && days >= 0 && days <= 5;
}

function visibleClients() {
    const query = state.search.trim().toLocaleLowerCase('es-MX');

    return state.clients.filter((client) => {
        if (state.status !== 'all' && client.estatus !== state.status &&
            !(state.status === 'urgent' && isUrgent(client)) &&
            !(state.status === 'balance' && number(client.saldo_vencido) > 0)) return false;
        if (state.statusFilter && client.estatus !== state.statusFilter) return false;
        if (state.obligationFilter && client.proxima_obligacion !== state.obligationFilter) return false;
        if (state.ownerFilter && client.contador_asignado !== state.ownerFilter) return false;
        if (state.regimeFilter && client.regimen_nombre !== state.regimeFilter) return false;
        if (!query) return true;

        return [
            client.razon_social,
            client.nombre_comercial,
            client.rfc,
            client.giro,
            client.contador_asignado,
            client.municipio,
        ].some((value) => String(value || '').toLocaleLowerCase('es-MX').includes(query));
    });
}

function populateFilter(selector, values, placeholder) {
    const select = $(selector);
    const currentValue = select.value;
    const uniqueValues = [...new Set(values.filter(Boolean).map(String))].sort((a, b) => a.localeCompare(b, 'es-MX'));

    select.innerHTML = `<option value="">${escapeHtml(placeholder)}</option>` +
        uniqueValues.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join('');
    if (uniqueValues.includes(currentValue)) select.value = currentValue;
}

function updateFilterOptions() {
    populateFilter('#statusFilter', state.clients.map((client) => client.estatus), 'Estatus: Todos');
    populateFilter('#obligationFilter', state.clients.map((client) => client.proxima_obligacion), 'Obligación: Todas');
    populateFilter('#ownerFilter', state.clients.map((client) => client.contador_asignado), 'Responsable: Todos');
    populateFilter('#regimeFilter', state.clients.map((client) => client.regimen_nombre), 'Régimen: Todos');
}

function renderSummary() {
    const indicators = state.indicators;
    const statusCounts = state.clients.reduce((counts, client) => {
        counts[client.estatus] = (counts[client.estatus] || 0) + 1;
        return counts;
    }, {});
    const urgentCount = state.clients.filter(isUrgent).length;
    const balanceCount = state.clients.filter((client) => number(client.saldo_vencido) > 0).length;

    $('#countAll').textContent = numberFormatter.format(state.clients.length);
    $('#countCurrent').textContent = numberFormatter.format(statusCounts['Al corriente'] || 0);
    $('#countDue').textContent = numberFormatter.format(statusCounts['Por vencer'] || 0);
    $('#countLate').textContent = numberFormatter.format(statusCounts['En mora'] || 0);
    $('#countUrgent').textContent = numberFormatter.format(urgentCount);
    $('#countBalance').textContent = numberFormatter.format(balanceCount);

    $('#summaryPills').innerHTML = [
        `<span class="summary-pill">${numberFormatter.format(number(indicators.al_corriente))} Al corriente</span>`,
        `<span class="summary-pill warning">${numberFormatter.format(number(indicators.por_vencer))} Por vencer</span>`,
        `<span class="summary-pill danger">${numberFormatter.format(number(indicators.en_mora))} En mora</span>`,
        `<span class="summary-pill neutral">${numberFormatter.format(number(indicators.con_vencimientos_urgentes))} Vencimientos urgentes</span>`,
        `<span class="summary-pill neutral">${numberFormatter.format(number(indicators.con_saldo_pendiente))} Con saldo pendiente</span>`,
    ].join('');

    $('#directorySummary').textContent =
        `${numberFormatter.format(number(indicators.total_clientes_activos))} clientes activos en Solís y Asociados S.C. · Mérida, Yucatán`;
}

function clientIdentity(client) {
    const businessName = client.nombre_comercial || client.giro || (client.tipo_persona === 'PF' ? 'Persona Física' : 'Contribuyente');
    return `<div class="client-name">
        <span class="client-avatar">${escapeHtml(initials(client.razon_social))}</span>
        <span><strong>${escapeHtml(client.razon_social)}</strong><small>${escapeHtml(businessName)} · ${escapeHtml(client.tipo_persona || '')}</small></span>
    </div>`;
}

function ownerLabel(client) {
    const owner = client.contador_asignado || 'Sin asignar';
    return `<div class="owner"><span class="avatar">${escapeHtml(initials(owner))}</span><span>${escapeHtml(owner)}<small>${escapeHtml(client.puesto_contador || '')}</small></span></div>`;
}

function obligationLabel(client) {
    if (!client.proxima_obligacion) return '<span class="obligation-name">Sin vencimientos registrados</span>';
    return `<span class="obligation-name">${escapeHtml(client.proxima_obligacion)}<small>${escapeHtml(dateLabel(client.fecha_proxima_obligacion, { weekday: 'short', day: '2-digit', month: 'short' }))}</small></span>`;
}

function documentsLabel(client) {
    const progress = number(client.docs_total) > 0
        ? Math.min(100, Math.round(number(client.docs_validados) * 100 / number(client.docs_total)))
        : 0;
    const label = client.estado_documental || 'Sin documentos registrados';
    return `<span class="status-badge ${statusClass(label)}" title="${escapeHtml(client.detalle_documental || label)}">${escapeHtml(label)}</span>`;
}

function renderTable(clients) {
    const start = (state.page - 1) * state.pageSize;
    const pageClients = clients.slice(start, start + state.pageSize);

    if (pageClients.length === 0) {
        $('#clientRows').innerHTML = '<tr><td class="empty-row" colspan="7">No hay clientes que coincidan con estos filtros.</td></tr>';
        return pageClients;
    }

    $('#clientRows').innerHTML = pageClients.map((client) => `
        <tr data-client-id="${escapeHtml(client.id_cliente)}" tabindex="0" aria-label="Ver ficha de ${escapeHtml(client.razon_social)}">
            <td>${clientIdentity(client)}</td>
            <td><span class="rfc-code">${escapeHtml(client.rfc || 'Sin RFC')}</span></td>
            <td>${ownerLabel(client)}</td>
            <td>${obligationLabel(client)}</td>
            <td>${documentsLabel(client)}</td>
            <td><span class="money ${number(client.saldo_vencido) > 0 ? 'overdue' : ''}">${money(client.saldo_vencido)}</span></td>
            <td><button class="row-action" type="button" data-detail-id="${escapeHtml(client.id_cliente)}">Detalle</button></td>
        </tr>
    `).join('');

    return pageClients;
}

function renderCards(clients) {
    const start = (state.page - 1) * state.pageSize;
    const pageClients = clients.slice(start, start + state.pageSize);

    if (pageClients.length === 0) {
        $('#cardsGrid').innerHTML = '<p class="empty-row">No hay clientes que coincidan con estos filtros.</p>';
        return pageClients;
    }

    $('#cardsGrid').innerHTML = pageClients.map((client) => {
        const totalDocs = number(client.docs_total);
        const validatedDocs = number(client.docs_validados);
        const progress = totalDocs ? Math.min(100, Math.round(validatedDocs * 100 / totalDocs)) : 0;
        const status = client.estatus || 'Sin estatus';

        return `<article class="client-card" data-client-id="${escapeHtml(client.id_cliente)}">
            <div class="client-card-head">
                <div class="client-card-title"><span class="client-avatar">${escapeHtml(initials(client.razon_social))}</span><span><strong>${escapeHtml(client.razon_social)}</strong><small>${escapeHtml(client.rfc || 'Sin RFC')} · ${escapeHtml(client.giro || '')}</small></span></div>
                <span class="status-badge ${statusClass(status)}">${escapeHtml(status)}</span>
            </div>
            <div class="card-label"><small>PRÓXIMA OBLIGACIÓN</small><strong>${escapeHtml(client.proxima_obligacion || 'Sin vencimiento')}</strong><small>${escapeHtml(dateLabel(client.fecha_proxima_obligacion))}</small></div>
            <div class="card-label"><small>DOCUMENTOS · ${validatedDocs}/${totalDocs || 0}</small><strong>${escapeHtml(client.estado_documental || 'Sin documentos')}</strong><div class="doc-progress"><span style="width:${progress}%"></span></div></div>
            <div class="card-bottom"><span><small>SALDO VENCIDO</small><strong class="${number(client.saldo_vencido) > 0 ? 'money overdue' : 'money'}">${money(client.saldo_vencido)}</strong></span><button class="button" type="button" data-detail-id="${escapeHtml(client.id_cliente)}">Ver detalle</button></div>
        </article>`;
    }).join('');

    return pageClients;
}

function renderPagination(total) {
    const pages = Math.max(1, Math.ceil(total / state.pageSize));
    state.page = Math.min(state.page, pages);
    const first = total === 0 ? 0 : (state.page - 1) * state.pageSize + 1;
    const last = Math.min(total, state.page * state.pageSize);
    $('#paginationSummary').textContent = `Mostrando ${numberFormatter.format(first)}–${numberFormatter.format(last)} de ${numberFormatter.format(total)} clientes`;
    $('#pageButtons').innerHTML = `
        <button class="page-button" type="button" data-page="${state.page - 1}" aria-label="Página anterior" ${state.page <= 1 ? 'disabled' : ''}>‹</button>
        <span class="page-button active" aria-current="page">${state.page} / ${pages}</span>
        <button class="page-button" type="button" data-page="${state.page + 1}" aria-label="Página siguiente" ${state.page >= pages ? 'disabled' : ''}>›</button>
    `;
}

function renderDirectory() {
    const clients = visibleClients();
    renderSummary();
    renderPagination(clients.length);

    const pageClients = state.view === 'table' ? renderTable(clients) : renderCards(clients);
    $('#tableWrap').hidden = state.view !== 'table';
    $('#cardsGrid').style.display = state.view === 'cards' ? 'grid' : 'none';
    $('#tableViewButton').setAttribute('aria-pressed', String(state.view === 'table'));
    $('#cardViewButton').setAttribute('aria-pressed', String(state.view === 'cards'));
    $('#resultCount').textContent = `${numberFormatter.format(clients.length)} cliente${clients.length === 1 ? '' : 's'}`;

    return pageClients;
}

function setLoading(loading) {
    state.loading = loading;
    $('#loadingState').hidden = !loading;
    $('#errorState').hidden = true;
    $('#directory').hidden = loading;
    $('#refreshButton').disabled = loading;
    if (loading) {
        $('#syncLabel').textContent = 'Sincronizando datos';
        $('#syncFooter').textContent = 'Consultando la base de datos';
    }
}

async function loadDashboard() {
    setLoading(true);
    try {
        const response = await fetch(api.dashboardUrl, { headers: { Accept: 'application/json' } });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'No se pudo cargar el directorio.');

        state.clients = Array.isArray(data.clients) ? data.clients : [];
        state.indicators = data.indicators || {};
        state.businessDate = data.businessDate;
        state.page = 1;
        updateFilterOptions();
        $('#operationDate').textContent = dateLabel(state.businessDate, { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
        $('#exportButton').disabled = state.clients.length === 0;
        $('#syncLabel').textContent = 'Conexión activa';
        $('#syncFooter').textContent = `Datos actualizados · ${new Intl.DateTimeFormat('es-MX', { hour: '2-digit', minute: '2-digit' }).format(new Date())}`;
        $('#loadingState').hidden = true;
        $('#errorState').hidden = true;
        $('#directory').hidden = false;
        renderDirectory();
    } catch (error) {
        $('#loadingState').hidden = true;
        $('#directory').hidden = true;
        $('#errorState').hidden = false;
        $('#errorMessage').textContent = error.message || 'Revisa que Laravel y MySQL estén disponibles.';
        $('#syncLabel').textContent = 'Sin conexión';
        $('#syncFooter').textContent = 'No se pudieron sincronizar los datos';
    } finally {
        state.loading = false;
        $('#refreshButton').disabled = false;
    }
}

function showClientDetails(clientId) {
    const client = state.clients.find((item) => String(item.id_cliente) === String(clientId));
    if (!client) return;

    $('#dialogTitle').textContent = client.razon_social || 'Ficha del cliente';
    $('#dialogSubtitle').textContent = `${client.rfc || 'Sin RFC'} · ${client.tipo_persona === 'PF' ? 'Persona Física' : 'Persona Moral'}`;
    const details = [
        ['Estatus', client.estatus],
        ['Contador asignado', client.contador_asignado],
        ['Puesto', client.puesto_contador],
        ['Régimen fiscal', client.regimen_nombre || client.regimen],
        ['Giro', client.giro],
        ['Municipio', client.municipio],
        ['Próxima obligación', client.proxima_obligacion],
        ['Fecha límite', dateLabel(client.fecha_proxima_obligacion, { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })],
        ['Estado documental', client.estado_documental || 'Sin documentos'],
        ['Documentos validados', `${number(client.docs_validados)} de ${number(client.docs_total)}`],
        ['Saldo por cobrar', money(client.saldo_por_cobrar)],
        ['Saldo vencido', money(client.saldo_vencido)],
        ['Honorario mensual', money(client.honorario_mensual)],
        ['Empleados', numberFormatter.format(number(client.empleados))],
    ];
    $('#dialogContent').innerHTML = details.map(([label, value]) => `<div class="detail-item"><small>${escapeHtml(label)}</small><strong>${escapeHtml(value || 'No disponible')}</strong></div>`).join('');
    $('#clientDialog').showModal();
}

function downloadReport() {
    const clients = visibleClients();
    if (clients.length === 0) return;

    const columns = [
        ['razon_social', 'Razón social'],
        ['rfc', 'RFC'],
        ['estatus', 'Estatus'],
        ['contador_asignado', 'Contador'],
        ['regimen_nombre', 'Régimen'],
        ['proxima_obligacion', 'Próxima obligación'],
        ['fecha_proxima_obligacion', 'Fecha límite'],
        ['estado_documental', 'Estado documental'],
        ['saldo_por_cobrar', 'Saldo por cobrar'],
        ['saldo_vencido', 'Saldo vencido'],
    ];
    const csvCell = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const rows = [columns.map(([, label]) => csvCell(label)).join(',')];
    clients.forEach((client) => rows.push(columns.map(([key]) => csvCell(client[key])).join(',')));

    const blob = new Blob([`\uFEFF${rows.join('\r\n')}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'directorio-clientes.csv';
    link.click();
    URL.revokeObjectURL(url);
}

function setSearch(value, source) {
    state.search = value;
    if (source !== 'global') $('#globalSearch').value = value;
    if (source !== 'client') $('#clientSearch').value = value;
    state.page = 1;
    renderDirectory();
}

function buildPageContext() {
    const clients = visibleClients();
    const pageClients = clients.slice((state.page - 1) * state.pageSize, state.page * state.pageSize);

    return JSON.stringify({
        view: state.view === 'table' ? 'tabla de clientes' : 'tarjetas de clientes',
        filters: {
            search: state.search || null,
            status: state.status === 'all' ? null : state.status,
            statusFilter: state.statusFilter || null,
            obligation: state.obligationFilter || null,
            accountant: state.ownerFilter || null,
            regime: state.regimeFilter || null,
        },
        resultCount: clients.length,
        currentPage: state.page,
        clients: pageClients.map((client) => ({
            razon_social: client.razon_social,
            rfc: client.rfc,
            estatus: client.estatus,
            contador: client.contador_asignado,
            obligacion: client.proxima_obligacion,
            fecha_limite: client.fecha_proxima_obligacion,
            documentos: client.estado_documental,
            saldo_vencido: client.saldo_vencido,
        })),
    });
}

function appendChatMessage(text, sender, isError = false) {
    const message = document.createElement('div');
    message.className = `chat-message ${sender}${isError ? ' error' : ''}`;
    if (sender === 'assistant' && !isError) {
        message.classList.add('formatted');
        message.innerHTML = DOMPurify.sanitize(marked.parse(String(text ?? ''), { breaks: true, gfm: true }), {
            USE_PROFILES: { html: true },
            FORBID_TAGS: ['img'],
        });
    } else {
        message.textContent = text;
    }
    $('#chatMessages').append(message);
    message.scrollIntoView({ block: 'end', behavior: 'smooth' });
    return message;
}

function setChatLoading(loading) {
    $('#chatInput').disabled = loading;
    $('#sendChat').disabled = loading;
    if (loading) {
        const typing = document.createElement('div');
        typing.id = 'typingIndicator';
        typing.className = 'chat-message assistant typing-indicator';
        typing.innerHTML = '<i></i><i></i><i></i>';
        $('#chatMessages').append(typing);
        typing.scrollIntoView({ block: 'end' });
    } else {
        $('#typingIndicator')?.remove();
    }
}

async function sendChatMessage(question) {
    const text = String(question || '').trim();
    if (!text || state.loading) return;

    const previousHistory = state.history.slice(-12);
    appendChatMessage(text, 'user');
    $('#chatInput').value = '';
    $('#chatSuggestions').hidden = true;
    setChatLoading(true);

    try {
        const token = document.querySelector('meta[name="csrf-token"]').content;
        const response = await fetch(api.chatUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                'X-CSRF-TOKEN': token,
                'X-Requested-With': 'XMLHttpRequest',
            },
            body: JSON.stringify({
                message: text,
                history: previousHistory,
                context: buildPageContext(),
            }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'No se pudo procesar la pregunta.');

        state.history.push({ role: 'user', content: text });
        state.history.push({ role: 'assistant', content: data.reply });
        appendChatMessage(data.reply, 'assistant');
    } catch (error) {
        appendChatMessage(error.message || 'No se pudo conectar con el asistente.', 'assistant', true);
    } finally {
        setChatLoading(false);
        $('#chatInput').focus();
    }
}

$('#refreshButton').addEventListener('click', loadDashboard);
$('#retryButton').addEventListener('click', loadDashboard);
$('#exportButton').addEventListener('click', downloadReport);
$('#clientSearch').addEventListener('input', (event) => setSearch(event.target.value, 'client'));
$('#globalSearch').addEventListener('input', (event) => setSearch(event.target.value, 'global'));
$('#statusFilter').addEventListener('change', (event) => { state.statusFilter = event.target.value; state.page = 1; renderDirectory(); });
$('#obligationFilter').addEventListener('change', (event) => { state.obligationFilter = event.target.value; state.page = 1; renderDirectory(); });
$('#ownerFilter').addEventListener('change', (event) => { state.ownerFilter = event.target.value; state.page = 1; renderDirectory(); });
$('#regimeFilter').addEventListener('change', (event) => { state.regimeFilter = event.target.value; state.page = 1; renderDirectory(); });
$('#pageSize').addEventListener('change', (event) => { state.pageSize = number(event.target.value) || 10; state.page = 1; renderDirectory(); });
$('#tableViewButton').addEventListener('click', () => { state.view = 'table'; renderDirectory(); });
$('#cardViewButton').addEventListener('click', () => { state.view = 'cards'; renderDirectory(); });

document.querySelector('.tabs').addEventListener('click', (event) => {
    const button = event.target.closest('[data-status]');
    if (!button) return;
    state.status = button.dataset.status;
    state.page = 1;
    document.querySelectorAll('.tab').forEach((tab) => {
        const active = tab === button;
        tab.classList.toggle('active', active);
        tab.setAttribute('aria-selected', String(active));
    });
    renderDirectory();
});

$('#pageButtons').addEventListener('click', (event) => {
    const button = event.target.closest('[data-page]');
    if (!button || button.disabled) return;
    state.page = number(button.dataset.page);
    renderDirectory();
});

$('#clientRows').addEventListener('click', (event) => {
    const row = event.target.closest('[data-client-id]');
    if (row) showClientDetails(row.dataset.clientId);
});
$('#clientRows').addEventListener('keydown', (event) => {
    const row = event.target.closest('[data-client-id]');
    if (row && (event.key === 'Enter' || event.key === ' ')) {
        event.preventDefault();
        showClientDetails(row.dataset.clientId);
    }
});
$('#cardsGrid').addEventListener('click', (event) => {
    const button = event.target.closest('[data-detail-id]');
    if (button) showClientDetails(button.dataset.detailId);
});

$('#closeDialog').addEventListener('click', () => $('#clientDialog').close());
$('#clientDialog').addEventListener('click', (event) => {
    if (event.target === $('#clientDialog')) $('#clientDialog').close();
});

function toggleChat(open) {
    $('#chatPanel').hidden = !open;
    $('#chatLauncher').setAttribute('aria-expanded', String(open));
    if (open) $('#chatInput').focus();
}

$('#chatLauncher').addEventListener('click', () => toggleChat($('#chatPanel').hidden));
$('#closeChat').addEventListener('click', () => toggleChat(false));
$('#resetChat').addEventListener('click', () => {
    if ($('#chatInput').disabled) return;
    state.history = [];
    $('#chatMessages').replaceChildren();
    $('#chatSuggestions').hidden = false;
    appendChatMessage('Hola, soy el asistente de Cuadrio. Puedo consultar clientes, obligaciones, documentos y cobranza usando los datos del sistema. ¿Qué necesitas saber?', 'assistant');
});
$('#chatForm').addEventListener('submit', (event) => {
    event.preventDefault();
    sendChatMessage($('#chatInput').value);
});
$('#chatInput').addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        $('#chatForm').requestSubmit();
    }
});
$('#chatSuggestions').addEventListener('click', (event) => {
    const button = event.target.closest('[data-question]');
    if (button) sendChatMessage(button.dataset.question);
});

appendChatMessage('Hola, soy el asistente de Cuadrio. Puedo consultar clientes, obligaciones, documentos y cobranza usando los datos del sistema. ¿Qué necesitas saber?', 'assistant');
loadDashboard();
