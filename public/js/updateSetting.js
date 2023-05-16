/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';

export async function updateSetting(data, type) {
  try {
    let url = '';
    if (type === 'password') {
      url = 'http://127.0.0.1:3000/api/v1/users/updatePassword';
    }
    if (type === 'data') {
      url = 'http://127.0.0.1:3000/api/v1/users/updateMe';
    }
    const result = await axios({
      method: 'PATCH',
      url,
      data
    });
    if (result.data.status === 'success') {
      showAlert('success', 'Đổi thông tin thành công');
    }
    console.log(result);
  } catch (error) {
    showAlert('error', error.response.data.message);
    console.log('👙  error: ', error);
  }
}
