const socket = io() //connect to the server

const $messageForm = document.querySelector('#id001')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocation = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

//Options
const {username, room } = Qs.parse(location.search, {ignoreQueryPrefix: true})

const autoscroll = () => {
    //New message element
    const $newMessage = $messages.lastElementChild

    //Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    //Visible height
    const visibleHeight = $messages.offsetHeight

    //Height of messages container
    const containerHeight = $messages.scrollHeight

    // How far have I scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }
}

socket.on('message', (mssg) => { // receive data from server.
     const html = Mustache.render(messageTemplate, {
         username: mssg.username,
         message: mssg.text,
         createdAt: moment(mssg.createdAt).format('h:mm a')
     })
     $messages.insertAdjacentHTML('beforeend', html)
     autoscroll()
 })

 socket.on('locationMessage', (mssg) => {
     const html = Mustache.render(locationTemplate, {
        username: mssg.username, 
        url: mssg.url,
         createdAt: moment(mssg.createdAt).format('h:mm a')
     })
     $messages.insertAdjacentHTML('beforeend', html)
     autoscroll()
 })

 socket.on('roomData', ({ room, users}) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
   
 })

$messageForm.addEventListener('submit', (e) => {
    e.preventDefault() 

    //disable
    $messageFormButton.setAttribute('disabled', 'disabled')
    
    const message = e.target.elements.message.value
    socket.emit('sendMessage', message, (error) => {
    // enable
    $messageFormButton.removeAttribute('disabled')
    $messageFormInput.value = ''
    $messageFormInput.focus()


        if(error) {
           return console.log('The message failed '+error)
        }
        console.log('The message was delivered..')
    })

})

$sendLocation.addEventListener('click', () => {
    $sendLocation.setAttribute('disabled', 'disabled')
    if (!navigator.geolocation) {
        return alert('Geolocation is not supported by your browser')
    }

    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('sendLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, () => {
            $sendLocation.removeAttribute('disabled')
            console.log('Location shared')
        })
        
    })
})

socket.emit('join', { username, room}, (error) => {
    if(error) {
        alert(error)
        location.href = '/'
    }

})

