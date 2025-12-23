export default function manifest() {
    return {
        name: 'Evas Barcelona - Gestión',
        short_name: 'Evas Admin',
        description: 'Sistema de gestión interna para Evas Barcelona',
        start_url: '/admin/dashboard',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#ffffff',
        icons: [
            {
                src: '/favicon.png',
                sizes: 'any',
                type: 'image/png',
            },
        ],
    }
}
