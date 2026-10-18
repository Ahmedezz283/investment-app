ui = true

api_addr     = "https://172.25.0.4:8200"
cluster_addr = "https://172.25.0.4:8201"

storage "raft" {
  path    = "/vault/file"
  node_id = "vault-3"

  retry_join {
    leader_api_addr     = "https://10.30.13.15:8200"
    leader_ca_cert_file = "/vault/config/tls/leader-ca.crt"
  }
}

listener "tcp" {
  address         = "0.0.0.0:8200"
  cluster_address = "0.0.0.0:8201"
  tls_cert_file   = "/vault/config/tls/vault-node3.crt"
  tls_key_file    = "/vault/config/tls/vault-node3.key"
}
