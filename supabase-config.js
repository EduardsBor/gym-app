'use strict';
// Public client config. The publishable/anon key is safe in the browser; RLS protects rows.
// Never put the service_role / secret key here.
// Project krrhwuldkwkkcegxhyqq (Europe, bot email). Old project nwbnrjiiqfyuakotacln is left untouched.
window.MZ_SB={
  url:'https://krrhwuldkwkkcegxhyqq.supabase.co',
  anon:'sb_publishable_iKxrc976-ufo7srmdBMENQ_7j8WbY1a',
  // D-231: «Войти через Google» стоит за флагом, пока провайдер Google не включён в Supabase (callback: https://krrhwuldkwkkcegxhyqq.supabase.co/auth/v1/callback).
  googleAuth:false
};
