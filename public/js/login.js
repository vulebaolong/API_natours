/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';

export async function login(email, password) {
  try {
    const result = await axios({
      method: 'POST',
      url: '/api/v1/users/login',
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
  } catch (error) {
    showAlert('error', error.response.data.message);
    console.error('👙  error: ', error);
  }
}

export async function logout() {
  try {
    const result = await axios({
      method: 'GET',
      url: '/api/v1/users/logout'
    });

    if (result.data.status === 'success') location.reload(true);
  } catch (error) {
    showAlert('error', error.response.data.message);
  }
}
