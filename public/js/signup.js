import '@babel/polyfill';
import axios from 'axios';
import { showAlert, hideAlert } from './alert';

export const signup = async(name, email, password, passwordConfirm) => {
    try{
        showAlert('Wait!', 'Your request is being processed ...');
        const res = await axios({
            method: 'POST',
            url: '/api/v1/users/signup',
            data: {
                name,
                email,
                password,
                passwordConfirm
            }
        });
        if(res.data.status === 'success'){
            showAlert('success', 'You are sign in successfully!');
            window.setTimeout(() => {
                location.assign('/login');
            }, 1500);
        }
    } catch(err) {
        showAlert('something went wrong', 500);
        console.log(err);
    }
};