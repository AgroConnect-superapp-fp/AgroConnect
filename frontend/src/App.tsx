import { RouterProvider } from 'react-router';
import { AuthProvider } from './auth/context/AuthProvider';
import { router } from './app/router';

export default function App(): React.ReactElement {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
