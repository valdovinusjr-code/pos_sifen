const API_URL = 'http://localhost:3000'

async function fetchProtegido(endpoint, metodo = 'GET', body = null){
    let token = localStorage.getItem('token')?.trim()

    if (token?.startsWith('Bearer ')) {
        token = token.slice(7).trim()
    }

    if (!token || token.split('.').length !== 3) {
        localStorage.removeItem('token')
        localStorage.removeItem('rol')
        window.location.href = 'login.html'
        return null
    }

    const rutaLimpia = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint
    const control = {
        method: metodo,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        cache: 'no-store'
    }

    if(body){
        control.body = JSON.stringify(body)
    }

    const respuesta = await fetch(`${API_URL}/${rutaLimpia}`, control)

    if(respuesta.status === 401){
        localStorage.removeItem('token')
        localStorage.removeItem('rol')
        alert('Tu sesion ha expirado o el token no es valido')
        window.location.href = 'login.html'
        return null
    }

    return respuesta
}
