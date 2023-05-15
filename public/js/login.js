/* eslint-disable */

async function login(email, password) {
  console.log(email, password);
  const result = await axios({
    method: 'POST',
    url: 'http://127.0.0.1:3000/api/v1/users/login',
    data: {
      email,
      password
    }
  });
  console.log(result);
}

document.querySelector('.form').addEventListener('submit', function(e) {
  e.preventDefault();
  const email = document.querySelector('#email').value;
  const password = document.querySelector('#password').value;
  login(email, password);
});
