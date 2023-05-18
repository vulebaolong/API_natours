/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';

export async function updateSetting(data, type) {
  try {
    const url =
      type === 'password'
        ? 'http://127.0.0.1:3000/api/v1/users/updatePassword'
        : 'http://127.0.0.1:3000/api/v1/users/updateMe';
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
