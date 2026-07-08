window.onload=function(){
    document.getElementById("nombre").focus()
}

async function registrar(){
    let nombre=document.getElementById("nombre").value.trim()
    let apellido=document.getElementById("apellido").value.trim()
    let correo=document.getElementById("correo").value.trim()
    let password=document.getElementById("password").value
    if(!nombre || !apellido || !correo || !password){
        mostrarMensaje("Completa todos los campos")
        return
    }

    if(!correo.includes("@") || !correo.includes(".")){
        mostrarMensaje("Correo inválido")
        return
    }

    if(password.length<6){
        mostrarMensaje("La contraseña debe tener mínimo 6 caracteres")
        return
    }

    let datos={
        nombre,
        apellido,
        correo,
        password
    }

    let res=await fetch("/registro",{
        method:"POST",
        headers:{
            "Content-Type":"application/json"
        },
        body:JSON.stringify(datos)
    })

    let data=await res.json()

    if(data.mensaje!=="usuario creado"){
        mostrarMensaje("No fue posible crear la cuenta")
        return
    }

    mostrarMensaje(
        "Cuenta creada correctamente. Un administrador debe aprobar tu acceso.",
        "exito"
    )

    document.getElementById("nombre").value=""
    document.getElementById("apellido").value=""
    document.getElementById("correo").value=""
    document.getElementById("password").value=""

    setTimeout(()=>{
        window.location="index.html"
    },2500)
}

function mostrarMensaje(texto,tipo="error"){
    let msg=document.getElementById("mensaje")
    msg.innerText=texto
    msg.className="mensaje "+tipo
    msg.style.display="block"

    if(tipo==="error"){
        document.getElementById("password").value=""
        document.getElementById("password").focus()
    }

    setTimeout(()=>{
        msg.style.display="none"
    },3000)
}