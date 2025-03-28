pipeline {
    agent any

    environment {
        DOCKER_IMAGE = 'clab-task-app'
        DOCKER_HUB_USER = 'jagath10'
        AWS_REGION = 'us-east-1'
        SNS_TOPIC_ARN = 'arn:aws:sns:us-east-1:908027374186:created_success'
        EC2_INSTANCE = '54.234.43.52'
        DB_HOST = '54.234.43.52'  // EC2 instance where MariaDB is running
        DB_PORT = '3306'
    }

    stages {
        stage('Initialize Variables') {
            steps {
                script {
                    env.DOCKER_TAG = "latest-${System.currentTimeMillis()}"
                    env.CONTAINER_NAME = "clab-container-${System.currentTimeMillis()}"
                }
            }
        }

        stage('Checkout Code') {
            steps {
                script {
                    git branch: 'master', url: 'https://github.com/JAGATH10/DevOps-Clab-project.git'
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    sh "docker build -t ${DOCKER_IMAGE}:${DOCKER_TAG} ."
                }
            }
        }

        stage('Tag & Push Docker Image to Docker Hub') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'docker-hub-cred', usernameVariable: 'DOCKER_HUB_USER', passwordVariable: 'DOCKER_PASSWORD')]) {
                    script {
                        sh """
                            docker tag ${DOCKER_IMAGE}:${DOCKER_TAG} ${DOCKER_HUB_USER}/${DOCKER_IMAGE}:${DOCKER_TAG}
                            echo "$DOCKER_PASSWORD" | docker login -u "$DOCKER_HUB_USER" --password-stdin
                            docker push ${DOCKER_HUB_USER}/${DOCKER_IMAGE}:${DOCKER_TAG}
                        """
                    }
                }
            }
        }

        stage('Deploy on EC2') {
            steps {
                sshagent(['ec2-ssh-key']) {
                    script {
                        sh """
                            ssh -o StrictHostKeyChecking=no ec2-user@${EC2_INSTANCE} '
                            docker pull ${DOCKER_HUB_USER}/${DOCKER_IMAGE}:${DOCKER_TAG} &&
                            docker stop \$(docker ps -q --filter ancestor=${DOCKER_HUB_USER}/${DOCKER_IMAGE}) || true &&
                            docker rm \$(docker ps -aq --filter ancestor=${DOCKER_HUB_USER}/${DOCKER_IMAGE}) || true &&
                            docker run -d --name ${CONTAINER_NAME} -p 3000:3000 \
                                -e DB_HOST=${DB_HOST} \
                                -e DB_PORT=${DB_PORT} \
                                ${DOCKER_HUB_USER}/${DOCKER_IMAGE}:${DOCKER_TAG}
                            '
                        """
                    }
                }
            }
        }

        stage('Notify Success via AWS SNS') {
            steps {
                withCredentials([aws(credentialsId: 'aws-cred')]) {
                    script {
                        sh """
                            aws sns publish --region ${AWS_REGION} --topic-arn ${SNS_TOPIC_ARN} --message 'Build & Deployment successful!'
                        """
                    }
                }
            }
        }
    }

    post {
        failure {
            withCredentials([aws(credentialsId: 'aws-cred')]) {
                script {
                    sh """
                        aws sns publish --region ${AWS_REGION} --topic-arn ${SNS_TOPIC_ARN} --message 'Build & Deployment failed!'
                    """
                }
            }
        }
    }
}
