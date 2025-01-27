//Exportación de librerías necesarias
import express, { request, response } from 'express'
import session from 'express-session'
import bodyParser from 'body-parser'
import { v4 as uuidv4 } from 'uuid'; //versión 4 de uuid
import os, { networkInterfaces } from 'os';
import { error } from 'console';
import e from 'express';
import macaddress from 'macaddress';
import moment from 'moment-timezone';


const app = express();
const PORT = 3500;

app.listen(PORT, () => {
    console.log(`Servidor iniciado en http://localhost${PORT}`);
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const sessions = {};

app.use(
    session({
        secret: "P4-EGP#perroSalvaje-SessionesHTTP-VariablesdeSesion",
        resave: false,
        saveUninitialized: true,
        cookie: { maxAge: 5 * 60 * 1000 }
    })
);

app.get('/', (req, res) => {
    return res.status(200).json({
        message: 'Bienvendi@ a la API de Control de Sesiones',
        author: 'Esther Gonzalez Peralta'
    });
});

const getLocalIp = () => {
    const networkInterfaces = os.networkInterfaces();
    for (const interfaceName in networkInterfaces) {
        const interfaces = networkInterfaces[interfaceName];
        for (const iface of interfaces) {
            if (iface.family === "IPv4" && !iface.internal) {
                return iface.address;
            }
        }
    }
    return null;
};

const getServerMac = () => {
    return new Promise((resolve, reject) => {
        macaddress.one((err, mac) => {
            if (err) {
                reject(err);
            }
            resolve(mac);
        });
    });
};

app.post('/login', async (req, res) => {
    const { email, nickname, macAddress } = req.body;
    if (!email || !nickname || !macAddress) {
        return res.status(400).json({
            message: 'Se esperan campos requeridos'
        });
    }

    const sessionID = uuidv4();
    const createdAt_CDMX = moment().tz('America/Mexico_City').format('YYYY/MM/DD HH:mm:ss');

    req.session.email = email;
    req.session.sessionID = sessionID;
    req.session.nickname = nickname;
    req.session.macAddress = macAddress;
    req.session.createdAt = createdAt_CDMX;
    req.session.lastAccessed = createdAt_CDMX;
    req.session.serverIp = getLocalIp();
    req.session.serverMac = await getServerMac();

    sessions[sessionID] = req.session;

    res.status(200).json({
        message: 'Se ha logueado de manera exitosa',
        sessionID
    });
});

app.post('/logout', (req, res) => {
    if (!req.session.sessionID || !sessions[req.session.sessionID]) {
        return res.status(404).json({
            message: 'No existe una sesión activa'
        });
    }

    delete sessions[req.session.sessionID];
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({
                message: 'Error al cerrar sesión'
            });
        }
    });

    res.status(200).json({
        message: 'Logout exitoso'
    });
});

app.post('/update', (req, res) => {
    const { email, nickname } = req.body;

    if (!req.session.sessionID || !sessions[req.session.sessionID]) {
        return res.status(404).json({
            message: 'No existe una sesión activa'
        });
    }

    if (email) req.session.email = email;
    if (nickname) req.session.nickname = nickname;
    req.session.lastAccessed = moment().tz('America/Mexico_City').format('YYYY/MM/DD HH:mm:ss');

    sessions[req.session.sessionID] = req.session;

    res.status(200).json({
        message: 'Datos actualizados',
        session: req.session
    });
});

app.get('/status', (req, res) => {
    if (!req.session.sessionID || !sessions[req.session.sessionID]) {
        return res.status(404).json({
            message: 'No existe una sesión activa'
        });
    }

    const session = sessions[req.session.sessionID];
    const now = moment();
    const idleTime = now.diff(moment(session.lastAccessed, 'YYYY/MM/DD HH:mm:ss'), 'seconds');
    const duration = now.diff(moment(session.createdAt, 'YYYY/MM/DD HH:mm:ss'), 'seconds');

    res.status(200).json({
        message: 'Sesión activa',
        session,
        idleTime: `${idleTime} segundos`,
        duration: `${duration} segundos`
    });
});

app.get('/sessionactives', (req, res) => {
    if (Object.keys(sessions).length === 0) {
        return res.status(404).json({
            message: 'No hay sesiones activas'
        });
    }

    const formattedSessions = {};
    for (const sessionID in sessions) {
        const session = sessions[sessionID];
        formattedSessions[sessionID] = {
            ...session,
            createdAt: moment(session.createdAt).tz('America/Mexico_City').format('YYYY/MM/DD HH:mm:ss'),
            lastAccessed: moment(session.lastAccessed).tz('America/Mexico_City').format('YYYY/MM/DD HH:mm:ss')
        };
    }

    res.status(200).json({
        message: 'Sesiones activas',
        sessions: formattedSessions
    });
});

setInterval(() => {
    const now = moment();
    for (const sessionID in sessions) {
        const session = sessions[sessionID];
        const idleTime = now.diff(moment(session.lastAccessed, 'YYYY/MM/DD HH:mm:ss'), 'seconds');
        if (idleTime > 120) { // 2 minutos
            delete sessions[sessionID];
        }
    }
}, 60000);