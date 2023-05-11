import axios from 'axios';

export const ApiClient = axios.create({
  baseURL: 'https://europe-west1-quickstart-1573558070219.cloudfunctions.net'
});
