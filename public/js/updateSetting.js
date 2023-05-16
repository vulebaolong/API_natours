/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';

export async function updateSetting(name, email) {
  console.log(name, email);
  try {
    const result = await axios({
      method: 'PATCH',
      url: 'http://127.0.0.1:3000/api/v1/users/updateMe',
      data: {
        name,
        email
      }
    });
    if (result.data.status === 'success') {
      showAlert('success', 'Đổi thông tin thành công');
      //   window.setTimeout(function() {
      //     location.assign('/');
      //   }, 1500);
    }
    console.log(result);
  } catch (error) {
    showAlert('error', error.response.data.message);
    console.log('👙  error: ', error);
  }
}
