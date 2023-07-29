import '@babel/polyfill';
import { login, logout } from './login';
import { displayMap } from './leaflet';
import { updateSettings } from './updateSettings';
import { bookTour } from './stripe';
import { signup } from './signup';

// DOM ELEMENTS
const leaflet = document.getElementById('map');
// console.log(leaflet)
const loginForm = document.querySelector('.form--login');
const signinForm = document.querySelector('.form--signup');
const logoutBtn = document.querySelector('.nav__el--logout');
const userDataForm = document.querySelector('.form-user-data');
const userPasswordForm = document.querySelector('.form-user-password');
const bookBtn = document.getElementById('book-tour');

// DELEGATION
if(leaflet) {
    const locations = JSON.parse(document.getElementById('map').dataset.locations);
    displayMap(locations);
}


if(loginForm) {
    loginForm.addEventListener('submit', e => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        login(email, password);
    })
}



if(signinForm) {
    signinForm.addEventListener('submit', e => {
        e.preventDefault();
        console.log('hello')
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const passwordConfirm = document.getElementById('passwordConfirm').value;

        signup(name, email, password, passwordConfirm);
        document.getElementById('name').value = '';
        document.getElementById('email').value = '';
        document.getElementById('password').value = '';
        document.getElementById('passwordConfirm').value = '';
    })
}

if(logoutBtn) {
    logoutBtn.addEventListener('click', logout);
}

if(userDataForm) {
    userDataForm.addEventListener('submit', e => {
        e.preventDefault();
        const form = new FormData();
        form.append('name', document.getElementById('name').value);
        form.append('email', document.getElementById('email').value);
        form.append('photo', document.getElementById('photo').files[0]);
        // const name = document.getElementById('name').value;
        // const email = document.getElementById('email').value;
        // updateSettings({name, email}, 'data');
        updateSettings(form, 'data');
    });
}

if(userPasswordForm) {
    userPasswordForm.addEventListener('submit', 
    async e => {
        e.preventDefault();
        document.querySelector('.btn--save-password').textContent = 'Updating...';
        const password = document.getElementById('password-current').value;
        const chpswd = document.getElementById('password').value;
        const chpswdConfirm = document.getElementById('password-confirm').value;
        await updateSettings(
            {password, chpswd, chpswdConfirm}, 
            'password'
        );
        
        document.querySelector('.btn--save-password').textContent = 'Save password';

        document.getElementById('password-current').value = '';
        document.getElementById('password').value = '';
        document.getElementById('password-confirm').value = '';
    });
}

// {
//     "password": "test1234",
//     "chpswd": "test12345",
//     "chpswdConfirm": "test12345"
// }

if(bookBtn) {
    bookBtn.addEventListener('click', e => {
        e.target.textContent = 'Processing...';
        const {tourId} = e.target.dataset;
        bookTour(tourId);
    })
}