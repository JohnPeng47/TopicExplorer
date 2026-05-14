import os

def create_log_files():
    log_dir = "/var/log/kong"
    server_log = os.path.join(log_dir, "server.log")
    llm_log = os.path.join(log_dir, "llm.log")

    if not os.path.exists(log_dir):
        os.makedirs(log_dir)

    open(server_log, 'a').close()
    open(llm_log, 'a').close()

if __name__ == "__main__":
    create_log_files()