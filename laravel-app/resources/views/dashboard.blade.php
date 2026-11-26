<!doctype html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="theme-color" content="#29243b">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>Clientes y Contribuyentes | Cuadrio</title>
    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
<body>
    <div class="app-shell">
        <aside class="sidebar" aria-label="Navegación principal">
            <a class="brand" href="#" aria-label="Cuadrio, inicio"><span class="brand-mark" aria-hidden="true">◈</span><span>Cuadrio</span></a>
            <div class="office-card"><small>DESPACHO FISCAL</small><strong>Solís y Asociados S.C.</strong></div>
            <nav class="nav-list">
                <a class="nav-link" href="#inicio"><span class="nav-icon">⌂</span>Inicio</a>
                <a class="nav-link active" href="#clientes" aria-current="page"><span class="nav-icon">♙</span>Clientes</a>
                <a class="nav-link" href="#documentos"><span class="nav-icon">▱</span>Documentos</a>
                <a class="nav-link" href="#vencimientos"><span class="nav-icon">◷</span>Vencimientos</a>
                <a class="nav-link" href="#cobranza"><span class="nav-icon">▣</span>Cobranza</a>
                <a class="nav-link" href="#mensajes"><span class="nav-icon">▤</span>Mensajes</a>
                <a class="nav-link" href="#auditoria"><span class="nav-icon">◉</span>Auditoría</a>
                <a class="nav-link" href="#configuracion"><span class="nav-icon">⚙</span>Configuración</a>
            </nav>
            <div class="sidebar-user"><span class="avatar">SA</span><span><strong>Solís y Asociados</strong><small>Equipo fiscal</small></span></div>
        </aside>

        <main class="main" id="clientes">
            <header class="topbar">
                <label class="top-search"><span aria-hidden="true">⌕</span><input id="globalSearch" type="search" placeholder="Buscar por cliente, RFC o folio..." aria-label="Buscar clientes"></label>
                <span class="top-spacer"></span>
                <div class="operation-date"><span>FECHA DE OPERACIÓN</span><strong id="operationDate">—</strong></div>
                <div class="top-user"><span class="avatar">SA</span><span>Solís y Asociados<small>Directorio fiscal</small></span></div>
            </header>

            <section class="content" aria-labelledby="pageTitle">
                <div class="heading-row">
                    <div>
                        <div class="eyebrow">Directorio fiscal v4.0 <span aria-hidden="true">•</span> <span id="syncLabel">Conectando con la base de datos</span></div>
                        <h1 id="pageTitle">Clientes y Contribuyentes</h1>
                        <p class="subtitle" id="directorySummary">Cargando cartera de clientes...</p>
                    </div>
                    <div class="header-actions">
                        <button class="button" id="exportButton" type="button" disabled><span aria-hidden="true">⇩</span> Exportar reporte</button>
                        <button class="button primary" id="refreshButton" type="button"><span aria-hidden="true">↻</span> Actualizar</button>
                    </div>
                </div>

                <div class="summary-pills" id="summaryPills" aria-label="Resumen de clientes"></div>
                <section class="directory-panel" aria-label="Directorio de clientes">
                    <div id="loadingState" class="state-panel"><div><div class="state-icon" aria-hidden="true">◌</div><h2>Cargando directorio</h2><p>Consultando clientes e indicadores de la base de datos.</p></div></div>
                    <div id="errorState" class="state-panel" hidden><div><div class="state-icon" aria-hidden="true">!</div><h2>No se pudo cargar el directorio</h2><p id="errorMessage">Revisa que el backend y la base de datos estén disponibles.</p><button id="retryButton" class="button primary" type="button">Reintentar</button></div></div>
                    <div id="directory" hidden>
                        <div class="panel-top">
                            <div class="tabs" role="tablist" aria-label="Filtrar por estado">
                                <button class="tab active" type="button" data-status="all" role="tab" aria-selected="true">Todos <span class="tab-count" id="countAll">0</span></button>
                                <button class="tab" type="button" data-status="Al corriente" role="tab" aria-selected="false">Al corriente <span class="tab-count" id="countCurrent">0</span></button>
                                <button class="tab" type="button" data-status="Por vencer" role="tab" aria-selected="false">Por vencer <span class="tab-count" id="countDue">0</span></button>
                                <button class="tab" type="button" data-status="En mora" role="tab" aria-selected="false">En mora <span class="tab-count" id="countLate">0</span></button>
                                <button class="tab" type="button" data-status="urgent" role="tab" aria-selected="false">Urgentes <span class="tab-count" id="countUrgent">0</span></button>
                                <button class="tab" type="button" data-status="balance" role="tab" aria-selected="false">Saldo vencido <span class="tab-count" id="countBalance">0</span></button>
                            </div>
                            <div class="panel-meta"><span id="resultCount">—</span><div class="view-switch" role="group" aria-label="Tipo de vista"><button id="tableViewButton" type="button" aria-label="Vista de tabla" aria-pressed="true">▤</button><button id="cardViewButton" type="button" aria-label="Vista de tarjetas" aria-pressed="false">▦</button></div></div>
                        </div>
                        <div class="filter-bar">
                            <label class="filter-control search-control"><span aria-hidden="true">⌕</span><input id="clientSearch" type="search" placeholder="Razón social, nombre comercial o RFC..." aria-label="Buscar en el directorio"></label>
                            <label class="filter-control"><select id="statusFilter" aria-label="Filtrar por estatus"><option value="">Estatus: Todos</option></select></label>
                            <label class="filter-control"><select id="obligationFilter" aria-label="Filtrar por obligación"><option value="">Obligación: Todas</option></select></label>
                            <label class="filter-control"><select id="ownerFilter" aria-label="Filtrar por responsable"><option value="">Responsable: Todos</option></select></label>
                            <label class="filter-control"><select id="regimeFilter" aria-label="Filtrar por régimen"><option value="">Régimen: Todos</option></select></label>
                        </div>
                        <div class="table-wrap" id="tableWrap">
                            <table>
                                <thead><tr><th>Razón social / contribuyente</th><th>RFC fiscal</th><th>Contador asignado</th><th>Próxima obligación</th><th>Estado documental</th><th>Saldo vencido</th><th></th></tr></thead>
                                <tbody id="clientRows"></tbody>
                            </table>
                        </div>
                        <div class="cards-grid" id="cardsGrid"></div>
                        <div class="pagination">
                            <span id="paginationSummary">Mostrando 0 de 0 clientes</span>
                            <div class="pagination-right">
                                <label>Mostrar: <select id="pageSize" aria-label="Clientes por página"><option value="5">5 por página</option><option value="10" selected>10 por página</option><option value="20">20 por página</option></select></label>
                                <div class="page-buttons" id="pageButtons" aria-label="Paginación"></div>
                            </div>
                        </div>
                    </div>
                </section>
                <footer class="sync-footer"><span>Cuadrio SaaS <span aria-hidden="true">•</span> Directorio fiscal</span><span class="sync-state" id="syncFooter">Sincronizando datos</span></footer>
            </section>
        </main>
    </div>

    <dialog id="clientDialog" aria-labelledby="dialogTitle">
        <div class="dialog-head"><div><h2 id="dialogTitle">Ficha del cliente</h2><p id="dialogSubtitle"></p></div><button class="dialog-close" id="closeDialog" type="button" aria-label="Cerrar">×</button></div>
        <div class="dialog-content" id="dialogContent"></div>
    </dialog>

    <button class="chat-launcher" id="chatLauncher" type="button" aria-label="Abrir asistente virtual" aria-expanded="false"><span aria-hidden="true">✦</span><span class="chat-dot"></span></button>
    <section class="chat-panel" id="chatPanel" aria-label="Asistente virtual" hidden>
        <header class="chat-header">
            <div class="chat-brand"><span class="chat-brand-mark" aria-hidden="true">✦</span><span><strong>Asistente Cuadrio</strong><small>Consulta la información del directorio</small></span></div>
            <div class="chat-header-actions"><button id="resetChat" type="button" aria-label="Nueva conversación" title="Nueva conversación">↻</button><button id="closeChat" type="button" aria-label="Cerrar asistente">×</button></div>
        </header>
        <div class="chat-messages" id="chatMessages" aria-live="polite"></div>
        <div class="chat-suggestions" id="chatSuggestions">
            <button type="button" data-question="¿Cuántos clientes están en mora y cuál es el saldo vencido total?">Resumen de mora</button>
            <button type="button" data-question="¿Qué clientes tienen vencimientos próximos?">Próximos vencimientos</button>
            <button type="button" data-question="¿Qué documentos están pendientes?">Documentos pendientes</button>
        </div>
        <form class="chat-compose" id="chatForm">
            <textarea id="chatInput" rows="1" maxlength="2000" placeholder="Pregunta sobre clientes, documentos, vencimientos..." aria-label="Escribe tu pregunta"></textarea>
            <button id="sendChat" type="submit" aria-label="Enviar pregunta">➤</button>
        </form>
    </section>

    <script>
        window.cuadrioConfig = {
            dashboardUrl: @json(route('api.dashboard')),
            healthUrl: @json(route('api.health')),
            chatUrl: @json(route('api.chat'))
        };
    </script>
</body>
</html>
