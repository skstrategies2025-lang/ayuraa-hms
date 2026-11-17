# AYURAAURAA – HMS Portal only

    npm install
    npm run dev        (http://localhost:5173)
    npm run build      (upload everything inside dist/)

## Backend
The portal is fully dynamic – every screen reads and saves through the API.
All endpoints, the request helper (`callApi`) and the session live in **`src/common/index.js`**.
Default server: `https://silver-raven-350418.hostingersite.com/api`
To use another server create a `.env` file:  `VITE_API_URL=http://localhost:5000/api`

## Login
POST `auth/login` with `{ identifier, password, portal: "hms" }`.
The answer `data.user` should carry `id, userId, name, staffRole, hospitalId` (and `branchId` for branch-bound staff).
Every later call sends `hospital_id / user_id / branch_id` in the body (`getContext()`).

## Data flow
    screens (components/*)  ->  AyurStorage (services/storage.js)  ->  callApi(SummaryApi.xxx)  ->  API
First load: `hms/get-bootstrap`. Each add / edit / delete: `hms/create-record`, `update-record`, `delete-record`
(collection = patients | medicines | panchakarma | appointments | invoices | staff | camps | templates |
clinicLeads | pamphlets | ksharaSutra | dietCharts | doctorTodos).
Settings, branches, doctor notes and backup restore have their own endpoints (see SummaryApi).

## Structure
    src/common/index.js       all endpoints + callApi + session
    src/modules/auth/         login page
    src/modules/hms/          the HMS portal (HmsPortal.jsx, components/, services/storage.js)
    src/routes/               /login and /hms/:tab
