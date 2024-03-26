#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <netinet/in.h>

#define PORT 8080
#define BUFSIZE 8096
#define ERROR_404 "HTTP/1.1 404 Not Found\nContent-Length: 136\nConnection: close\nContent-Type: text/html\n\n<html><head>\n<title>404 Not Found</title>\n</head><body>\n<h1>Not Found</h1>\nThe requested URL was not found on this server.\n</body></html>\n"

void handle_http_request(int client_fd) {
    char buf[BUFSIZE], *method, *uri, *version;
    read(client_fd, buf, BUFSIZE);

    method = strtok(buf, " ");
    uri = strtok(NULL, " ");
    version = strtok(NULL, "\r");

    printf("%s %s %s\n", method, uri, version);

    if (strcmp(uri, "/") == 0) uri = "/index.html"; // Si l'URI est juste "/", servez index.html

    // Construisez le chemin du fichier en préfixant le dossier où se trouvent vos fichiers web
    char filepath[1024];
    sprintf(filepath, "web%s", uri);

    FILE *file = fopen(filepath, "r");
    if (file == NULL) {
        write(client_fd, ERROR_404, strlen(ERROR_404));
    } else {
        // Envoyer l'entête de réponse HTTP 200 OK
        char header[1024];
        sprintf(header, "HTTP/1.1 200 OK\n\n");
        write(client_fd, header, strlen(header));

        // Lire le fichier et l'envoyer en blocs
        int bytes_read;
        while ((bytes_read = fread(buf, 1, BUFSIZE, file)) > 0) {
            write(client_fd, buf, bytes_read);
        }
        fclose(file);
    }
}

int main() {
    int server_fd, client_fd;
    struct sockaddr_in server_addr, client_addr;
    socklen_t sin_len = sizeof(client_addr);

    server_fd = socket(AF_INET, SOCK_STREAM, 0);
    if (server_fd < 0) {
        perror("socket");
        exit(1);
    }

    server_addr.sin_family = AF_INET;
    server_addr.sin_addr.s_addr = INADDR_ANY;
    server_addr.sin_port = htons(PORT);

    if (bind(server_fd, (struct sockaddr *) &server_addr, sizeof(server_addr)) == -1) {
        perror("bind");
        close(server_fd);
        exit(1);
    }

    if (listen(server_fd, 5) < 0) {
        perror("listen");
        close(server_fd);
        exit(1);
    }

    printf("Server is listening on port %d\n", PORT);

    while (1) {
        client_fd = accept(server_fd, (struct sockaddr *) &client_addr, &sin_len);
        if (client_fd == -1) {
            perror("Connection failed...\n");
            continue;
        }

        handle_http_request(client_fd);
        close(client_fd);
    }

    close(server_fd);
    return 0;
}
