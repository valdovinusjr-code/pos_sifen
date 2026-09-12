const user_form = document.getElementById('login-form')

user_form.addEventListener('submit', async(e)=> {
    e.preventDefault()

    const usuario = document.getElementById('login').value.trim()
    const contraseña = document.getElementById('password').value

    if(!usuario || !contraseña){
        console.log('Ambos campos son obligatorios')
        return
    }

    try{
        const respuesta = await fetch('http://localhost:3000/usuarios/login', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                login: usuario,
                pass_hash: contraseña
            })
        })
        const datos = await respuesta.json()
        if(!respuesta.ok){
            alert(datos.error || 'No se pudo iniciar sesion')
            return
        }

        if(typeof datos.token !== 'string' || datos.token.split('.').length !== 3){
            alert('El servidor devolvio un token invalido')
            return
        }

        localStorage.setItem('token', datos.token)
        localStorage.setItem('rol', datos.rol)
        window.location.href = 'clientes.html'
    }catch(error){
        console.error(error)
    }
})
