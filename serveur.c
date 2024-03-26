#include <libwebsockets.h>
#include <string.h>
#include <stdio.h>

static int callback_echo(struct lws *wsi, enum lws_callback_reasons reason,
                         void *user, void *in, size_t len) {
    switch (reason) {
        case LWS_CALLBACK_ESTABLISHED:
            printf("Connexion établie\n");
            break;
        case LWS_CALLBACK_RECEIVE:
            printf("Reçu: %s\n", (const char *) in);
            // Échoyer le message reçu à tous les clients connectés
            lws_write(wsi, (unsigned char *)in, len, LWS_WRITE_TEXT);
            break;
        default:
            break;
    }

    return 0;
}

// Liste des protocoles supportés
static struct lws_protocols protocols[] = {
    {
        "http-only",   // nom
        callback_echo, // fonction de callback
        0,             // taille de la structure de données utilisateur
    },
    { NULL, NULL, 0 } // terminateur
};

int main(void) {
    struct lws_context_creation_info info;
    memset(&info, 0, sizeof(info));

    info.port = 8080;
    info.protocols = protocols;
    info.gid = -1;
    info.uid = -1;

    struct lws_context *context = lws_create_context(&info);
    if (context == NULL) {
        fprintf(stderr, "lws init failed\n");
        return -1;
    }

    printf("Démarrage du serveur sur le port %d\n", info.port);

    // Boucle d'écoute pour le serveur
    while (1) {
        lws_service(context, 50); // 50ms à chaque itération
    }

    lws_context_destroy(context);

    return 0;
}
