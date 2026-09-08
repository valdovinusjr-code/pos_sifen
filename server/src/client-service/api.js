const API_URL = 'http://localhost:3000'

async function fetchProtegido(endpoint, metodo = 'GET', body = null){
    const token = localStorage.getItem('token')

    const rutaLimpia = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint
    const control = {
        method: metodo,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    }

    if(body){
        control.body = JSON.stringify(body)
    }

    const respuesta = await fetch(`${API_URL}/${rutaLimpia}`, control)

    if(respuesta.status === 401){
        localStorage.removeItem('token')
        localStorage.removeItem('rol')
        alert("Tu sesion ha expirado")
        window.location.href = 'login.html'
        return null
    }

    return respuesta
}
