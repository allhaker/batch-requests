import axios from 'axios';
import { batchInterceptor } from './batch-interceptor';

export const ApiClient = axios.create({
  baseURL: 'https://europe-west1-quickstart-1573558070219.cloudfunctions.net'
});
batchInterceptor(ApiClient);
