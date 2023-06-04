import '@babel/polyfill';
import axios from 'axios';
import { showAlert, hideAlert } from './alert';


export const login = async (email, password) => {
    try{
        // here we send data from html to node using http request
        // another is directly use html form
        const res = await axios({
            method: 'POST',
            url: '/api/v1/users/login',
            data: {
                email,
                password
            }
        });
        if(res.data.status === 'success'){
            showAlert('success', 'You are logged in successfully!');
            window.setTimeout(() => {
                location.assign('/');
            }, 1500);
        }

    } catch (err) {
        showAlert('error', err.response.data.message);
    }
}

export const logout = async () => {
    try{
        const res = await axios({
            method: 'GET',
            url: '/api/v1/users/logout'
        });

        // Reload the page from server by setting true
        // if not set true then it will reload from the webpage
        if(res.data.status === 'success') {
            location.reload(true);
        }
    } catch(err) {
        showAlert('error', 'Error logging out! Try again.');
    }
}