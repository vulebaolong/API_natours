/* eslint-disable */
import '@babel/polyfill';
import { displayMap } from './mapbox';
import { login, logout } from './login';
import { updateSetting } from './updateSetting';

// DOM ELEMENTS
const mapBox = document.getElementById('map');
const loginForm = document.querySelector('.form--login');
const logOutBtn = document.querySelector('.nav__el--logout');
const dataForm = document.querySelector('.form-user-data');
const passwordForm = document.querySelector('.form-user-password');

if (mapBox) {
  const locations = JSON.parse(mapBox.dataset.locations);
  displayMap(locations);
}

if (loginForm) {
  loginForm.addEventListener('submit', function(e) {
    e.preventDefault();
    // VALUE
    const email = document.querySelector('#email').value;
    const password = document.querySelector('#password').value;
    login(email, password);
  });
}

if (logOutBtn) {
  logOutBtn.addEventListener('click', function(e) {
    logout();
  });
}

if (dataForm) {
  dataForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const form = new FormData();
    form.append('name', document.querySelector('#name').value);
    form.append('email', document.querySelector('#email').value);
    form.append('photo', document.querySelector('#photo').files[0]);
    updateSetting(form, 'data');
  });
}

if (passwordForm) {
  passwordForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    document.querySelector('.btn--save-password').innerText = 'Updating...';
    const passwordCurrent = document.querySelector('#password-current').value;
    const password = document.querySelector('#password').value;
    const passwordConfirm = document.querySelector('#password-confirm').value;

    await updateSetting(
      { passwordCurrent, password, passwordConfirm },
      'password'
    );

    document.querySelector('.btn--save-password').innerText = 'Save password';
    passwordForm.reset();
  });
}
