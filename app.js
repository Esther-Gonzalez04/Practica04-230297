//Exportación de librerías necesarias
import express, { request, response } from 'express'
import session from 'express-session'
import bodyParser from 'body-parser'
import { v4 as uuidv4 } from 'uuid'; //versión 4 de uuid
import os, { networkInterfaces } from 'os';
import { error } from 'console';
import e from 'express';


const app = express();
const PORT = 3500;

app.listen(PORT, () => {
    console.log(`Servidor iniciado en http://localhost${PORT}`);
});

app.use(express.json());
app.use(express.urlencoded({extended: true}));

//Sesiones almacenadas en Memoria(RAM) - Cuando Express cae, todo cae.
const sessions = {};

app.use(
    session({
        secret: "P4-ZAZP#Soundwave-SesionesHTTP-VariablesDeSesion",
        resave: false,
        saveUninitialized: false,
        cookie: {maxAge: 5* 60 * 1000 } //mil milisegundos
    })
)

app.get('/', (request, response) => {
    return response.status(200).json({message: "Bienvenid@ al API de Control de Sesiones", 
                                                    author: "Esther Gonzalez Peralta"})
})

//Función de utilidad que nos permitiera acceder a la información de la interfaz de red

const getLocalIp = () => {
    const newtworkInterfaces = os.networkInterfaces();
    for (const interfaceName in networkInterfaces) {
        const interfaces = newtworkInterfaces[interfaceName];
        for (const iface of interfaces) {
            //IPv4 y no interna (no localhost)
            if (iface.family === "IPv4" && !iface.internal) {
                return iface.address;
            }
        }
    }
    return null; //Retorna null si no encuentra una IP válida
}

/*const getClientIP = (request) => {
    return (
        request.headers["x-forwarded-for"] ||
        request.connection.remoteAddress ||
        request.socket.remoteAddress ||
        request.connection.socket?.remoteAddress
    );
};*/

app.post('/login', (request, response) => {
    const{email, nickname, macAddress} = request.body;

    if(!email || !nickname || !macAddress){
        return response.status(400).json({message: "Se esperan campos requeridos"});
    }

    const sessionId = uuidv4();
    const now = new Date();

    session[sessionId] = {
        sessionId,
        email,
        nickname,
        macAddress,
        ip: getLocalIp(request),
        createAt: now, //CDMX format
        lastAccesed: now
    };

    response.status(200).json({
        message: "Se ha logueado exitosamente",
        sessionId
    })
})



app.post("/logout", (request, response) => {
    const {sessionId} = request.body;

    if(!sessionId || !sessions[sessionId]){
        return response.status(404).json({message: "No se ha encontrado una sesión activa."});
    }

    delete sessions[sessionId]; //Borra la sesión de la lista
    request.session.destroy((err) => {
        if(err){
            return response.status(500).send('Error al cerrar sesión')
        }
    })

    response.status(200).json({message: "Logout successful"});
});


app.post("/update", (request, response) => {
    const {sessionId, email, nickname} = request.body;

    if(!sessionId || !sessions[sessionId]){
        return response.status(404).json({message: "No existe una sesión activa"})
    }

    if(email) sessions[sessionId].email = email;
    if(nickname) sessions[sessionId].nickname = nickname;
        IdleDeadline()
        sessions[sessionId].lastAcceses = new Date();
})

app.get("/status", (request, response) => {
    const sessionId = request.query.sessionId;
    if(!sessionId || !sessions[sessionId]){
        response.status(404).json({message: "No hay sesiones activas"})
    }
    
    response.status(200).json({
        message: "Sesión Activa",
        session: sessions[sessionId]
    })
})