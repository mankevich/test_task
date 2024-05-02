import { createRouter, createWebHistory } from 'vue-router'
import DataList from '../views/DataList.vue'
import Document from '../views/Document.vue'

const routes = [
  {
    path: '/',
    name: 'datalist',
    component: DataList
  },
  {
    // принимаем динамический documentId
    path: '/document/:documentId',
    name: 'Document',
    component: () => import('../views/Document.vue')
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router
