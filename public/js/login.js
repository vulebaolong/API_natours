/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';

export async function login(email, password) {
  try {
    console.log(email, password);
    const result = await axios({
      method: 'POST',
      url: 'http://127.0.0.1:3000/api/v1/users/login',
      data: {
        email,
        password
      }
    });
    if (result.data.status === 'success') {
      showAlert('success', 'Đăng nhập thành công');
      window.setTimeout(function() {
        location.assign('/');
      }, 1500);
    }
    console.log(result);
  } catch (error) {
    showAlert('error', error.response.data.message);
    console.log('👙  error: ', error);
  }
}

export async function logout() {
  try {
    const result = await axios({
      method: 'GET',
      url: 'http://127.0.0.1:3000/api/v1/users/logout'
    });

    if (result.data.status === 'success') location.reload(true);
  } catch (error) {
    showAlert('error', error.response.data.message);
  }
}
