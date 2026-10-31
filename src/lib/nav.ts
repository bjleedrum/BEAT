import { router } from 'expo-router';

export const openLesson = (id: string) => router.push({ pathname: '/lesson/[id]', params: { id } });
