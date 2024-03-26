#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <arpa/inet.h>
#include <sys/types.h>
#include <sys/socket.h>

#define PORT 8080
#define BUFSIZE 8096
#define WEBROOT "/home/kali/Downloads/Projet-E4-main"

void serveFile(int client_fd, const char *uri) {
    char filepath[1024];
    char buffer[BUFSIZE];
    FILE *file;

    // Construction du chemin absolu vers le fichier
    snprintf(filepath, sizeof(filepath), "%s%s", WEBROOT, uri);

    // Si l'URI est juste "/", servir index.html
    if (strcmp(uri, "/") == 0) {
        snprintf(filepath, sizeof(filepath), "%s/index.html", WEBROOT);
    }

    file = fopen(filepath, "rb");
    if (file == NULL) {
        // Envoyer une réponse 404 Not Found si le fichier n'existe pas
        char *header = "HTTP/1.1 404 Not Found\n\n404 Not Found\n";
        write(client_fd, header, strlen(header));
    } else {
        // Envoyer l'en-tête HTTP OK avant le contenu du fichier
        char *header = "HTTP/1.1 200 OK\n\n";
        write(client_fd, header, strlen(header));

        // Lire le fichier et l'envoyer en blocs
        int bytes_read;
        while ((bytes_read = fread(buffer, 1, sizeof(buffer), file)) > 0) {
            write(client_fd, buffer, bytes_read);
        }
        fclose(file);
    }
}

int main() {
    int server_fd, client_fd;
    struct sockaddr_in server_addr, client_addr;
    socklen_t sin_len = sizeof(client_addr);
    char buffer[BUFSIZE];
    char *method, *uri;

    server_fd = socket(AF_INET, SOCK_STREAM, 0);
    if (server_fd < 0) {
        perror("Cannot open socket");
        exit(EXIT_FAILURE);
    }

    server_addr.sin_family = AF_INET;
    server_addr.sin_addr.s_addr = INADDR_ANY;
    server_addr.sin_port = htons(PORT);

    if (bind(server_fd, (struct sockaddr *)&server_addr, sizeof(server_addr)) == -1) {
        perror("Cannot bind");
        close(server_fd);
        exit(EXIT_FAILURE);
    }

    if (listen(server_fd, 10) == -1) {
        perror("Cannot listen");
        close(server_fd);
        exit(EXIT_FAILURE);
    }

    printf("Server is listening on %d\n", PORT);

    while (1) {
        client_fd = accept(server_fd, (struct sockaddr *)&client_addr, &sin_len);
        if (client_fd == -1) {
            perror("Cannot accept");
            continue;
        }

        // Lire la requête HTTP
        read(client_fd, buffer, BUFSIZE);
        method = strtok(buffer, " ");
        uri = strtok(NULL, " ");
        printf("Requested URI: %s\n", uri);

        // Servir le fichier demandé
        serveFile(client_fd, uri);

        // Fermer la connexion client
        close(client_fd);
    }

    return 0;
}
