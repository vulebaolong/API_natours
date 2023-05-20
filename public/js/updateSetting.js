/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';

export async function updateSetting(data, type) {
  try {
    const url =
      type === 'password'
        ? '/api/v1/users/updatePassword'
        : '/api/v1/users/updateMe';
    const result = await axios({
      method: 'PATCH',
      url,
      data
    });
    if (result.data.status === 'success') {
      showAlert('success', 'Đổi thông tin thành công');
    }
  } catch (error) {
    showAlert('error', error.response.data.message);
    console.error('👙  error: ', error);
  }
}
