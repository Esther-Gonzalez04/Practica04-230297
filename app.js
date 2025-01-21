//Exportacion de librerias necesarias 
import express, {request, response} from 'express';
import session from 'express-session';
import bodyParser from 'body-parser';
import { v4 as uuidv4 } from 'uuid';
import os from 'os';

const app = express();
const PORT= 3500;

app.listen(PORT , ()=>{
    console.log(`Servidor iniciado en http://localhost ${PORT}`);
});

app.use(express.json());
app.use(express.urlencoded({extended:true}));

//Sesiones almacenadas en memoria(RAM)

const sessions={};

app.use(
    session({
        secret: "P4-EGP#bonbonasesino-SesionesHTTP-VariablesDeSesion",
        resave: false,
        saveUninitialized: false,
        cookie: {maxAge: 5*60*1000} // mil milisegundos 
    })
)

app.get('/', (request, response)=>{
    return response.status(200).json({message: "Bienvenid@ al API de Control de sesiones",
        author: "Esther Gonzalez Peralta"
    })
});

//función de utilidad que nos permitiera ormacion de la interfaz de red 
const getLocalIp=()=>{
    const newtworkInterfaces= os.newtworkInterfaces();
    for(const interfaceName in newtworkInterfaces){
        const interfaces=newtworkInterfaces[interfaceName];
        for(const iface of interfaces){
            //IpV4 y no interna (no Localhost)
            if (iface.family === "IpV4" && !iface.internal){
                return iface.address;
            }
        }
    }
    return null; //retorna null si no ncuentra una IP valida
}

//Endpoint de logeo 
app.post('/login', (req, res)=>{
    const {email, nickname, macaddress}= req.body;

    if(!email || !nickname ||!macaddress){
        return res.status(400).json({message:"Se esperan campos requeridos"})
    }

    const sessionId = uuidv4();
    const now =new Date();

    session[sessionId]={
        sessionId,
        email,
        nickname,
        macaddress,
        ip : getLocalIp(req),
        createAt:now,
        lastAccesed:now

    }; 
    res.status(200).json({
        message: "Se ha logueado exitosamente",
        sessionId
    });

})

app.post("/logout", (request, response)=>{
    const{sessionId}=request.body;
    if(!sessionId || !sessions[sessionId]){
        return response.status(404).json({message: "No se ha encontrado una sesión activa"},)
    }

    delete sessions[sessionId];
    request.session.destroy((err)=>{
        if(err){
            return response.status(500).send("Error al cerrar sesión")
        }
    })
    response.status(200).json({message: "Logout sesseful"});
});

app.post("/update", (request, response)=>{
    const {sessionId, email, nickname}=request.body;

    if(!sessionId || !sessions[sessionId]){
        return response.status(404).json({message: "No existe una sesión activa"})
    }

    if(email) sessions[sessionId].email;
    if(nickname) sessions[sessionId].nickname=nickname;
    IdleDeadline()
    sessions[sessionId].LastAcces= new Date();
    
})

app.get("/status", (request, response)=>{
    const sessionId=request.query.sessionId;
    if(!sessionId || !sessions[sessionId]){
        response.status(404).json({message:"No hay"})
    }

    response.status(200).json({
        message: "Sesión Activa",
        session: sessions[sessionId]
    })
})