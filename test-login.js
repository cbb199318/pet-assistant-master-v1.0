const axios = require('axios');

async function testLogin() {
  try {
    const response = await axios.post('http://localhost:3000/api/users/login', {
      phone: '13800138000',
      password: '123456'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    console.log('登录成功:', response.data);
  } catch (error) {
    console.error('登录失败:', error.response ? error.response.data : error.message);
  }
}

testLogin();