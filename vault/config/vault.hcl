ui = true

api_addr     = "https://10.30.13.15:8200"
cluster_addr = "https://10.30.13.15:8201"

storage "raft" {
  path    = "/vault/file"
  node_id = "vault-1"
}

listener "tcp" {
  address         = "0.0.0.0:8200"
  cluster_address = "0.0.0.0:8201"
  tls_cert_file   = "/vault/config/tls/vault.crt"
  tls_key_file    = "/vault/config/tls/vault.key"
}