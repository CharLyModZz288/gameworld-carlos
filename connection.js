// connection.js
// Usamos el import desde esm.sh para que funcione directamente en el navegador con <script type="module">
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// 🔑 Credenciales del proyecto Supabase
const supabaseUrl = "https://vforasnmcipqpqwdkygm.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmb3Jhc25tY2lwcXBxd2RreWdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2MTIzMTYsImV4cCI6MjA3ODE4ODMxNn0.wP71pAkOFJ8YYNNN7lIRfSrJloqKFsKq3bIjphWBqFc";

// 🧩 Crear el cliente y exportarlo para usarlo en otros archivos (como register.js)
export const supabase = createClient(supabaseUrl, supabaseKey);
