const errors = {
  tr: {
    mealNotFound: 'Yemek bulunamadı.',
    pastMenu: 'Geçmiş menü yalnızca görüntülenir.',
    needLogin: 'Giriş yapman gerekiyor.',
    adminOnly: 'Bu işlem yalnızca yönetici için.',
    usernameShort: 'Kullanıcı adı en az 3 karakter olmalı.',
    passwordShort: 'Şifre en az 6 karakter olmalı.',
    usernameReserved: 'Bu kullanıcı adı alınamaz.',
    usernameTaken: 'Bu kullanıcı adı dolu.',
    badCredentials: 'Kullanıcı adı veya şifre hatalı.',
    adminUndeletable: 'Yönetici hesabı silinemez.',
    displayNameShort: 'Görünen ad en az 2 karakter olmalı.',
    userNotFound: 'Kullanıcı bulunamadı.',
    mealRequired: 'Yemek adı ve öğün gerekli.',
    badVote: 'Oy geçersiz.',
    badRating: 'Geçerli bir puan seç.',
    emptyComment: 'Yorum boş olamaz.',
    suggestionRequired: 'Öğün ve öneri gerekli.',
    badLike: 'Beğeni geçersiz.',
    suggestionNotFound: 'Öneri bulunamadı.',
    adminReadOnly: 'Yönetici yalnızca görüntüleyebilir.',
    serverError: 'Sunucu hatası.',
  },
  de: {
    mealNotFound: 'Gericht nicht gefunden.',
    pastMenu: 'Der vergangene Speiseplan ist nur zur Ansicht.',
    needLogin: 'Bitte zuerst anmelden.',
    adminOnly: 'Diese Aktion ist nur für Administratoren.',
    usernameShort: 'Der Benutzername muss mindestens 3 Zeichen haben.',
    passwordShort: 'Das Passwort muss mindestens 6 Zeichen haben.',
    usernameReserved: 'Dieser Benutzername ist nicht verfügbar.',
    usernameTaken: 'Dieser Benutzername ist bereits vergeben.',
    badCredentials: 'Benutzername oder Passwort ist falsch.',
    adminUndeletable: 'Das Administratorkonto kann nicht gelöscht werden.',
    displayNameShort: 'Der Anzeigename muss mindestens 2 Zeichen haben.',
    userNotFound: 'Benutzer nicht gefunden.',
    mealRequired: 'Gerichtsname und Mahlzeit sind erforderlich.',
    badVote: 'Ungültige Bewertung.',
    badRating: 'Bitte eine gültige Punktzahl wählen.',
    emptyComment: 'Der Kommentar darf nicht leer sein.',
    suggestionRequired: 'Mahlzeit und Vorschlag sind erforderlich.',
    badLike: 'Ungültige Bewertung.',
    suggestionNotFound: 'Vorschlag nicht gefunden.',
    adminReadOnly: 'Administratoren können nur ansehen.',
    serverError: 'Serverfehler.',
  },
}

export function langOf(req) {
  const raw = String(req.headers['x-lang'] || req.headers['accept-language'] || 'tr')
  return raw.toLowerCase().startsWith('de') ? 'de' : 'tr'
}

export function err(req, key) {
  const lang = langOf(req)
  return errors[lang][key] || errors.tr[key]
}
